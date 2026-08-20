export const prerender = false;

import type { APIRoute } from "astro";
import { calculatePrice } from "../../lib/pricing";
import { bookingPayloadSchema } from "../../lib/schemas";
import { generateBookingId, saveBooking } from "../../lib/bookings";
import { sendBookingEmails } from "../../lib/mail";
import { forwardToBookingBroom } from "../../lib/booking-broom";
import { getServiceBySlug } from "../../data/services";
import { getPricingConfig } from "../../lib/pricing-config";
import { getRuntimeEnv } from "../../lib/runtime-env";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const parsed = bookingPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const payload = parsed.data;
    const service = getServiceBySlug(payload.serviceSlug);
    if (!service) {
      return new Response(JSON.stringify({ ok: false, error: "Unknown service" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const runtimeEnv = await getRuntimeEnv(locals);

    // Priced here, not from the client, and with the same config the wizard read.
    const { config } = await getPricingConfig(runtimeEnv);
    const pricing = calculatePrice(
      payload.serviceSlug,
      payload.pricingDetails,
      config,
    );
    if (!pricing) {
      return new Response(JSON.stringify({ ok: false, error: "Could not calculate price" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const preferredDate = new Date(`${payload.preferredDate}T12:00:00`);
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (preferredDate < tomorrow) {
      return new Response(
        JSON.stringify({ ok: false, error: "Preferred date must be tomorrow or later" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const booking = {
      ...payload,
      id: generateBookingId(),
      createdAt: new Date().toISOString(),
      estimatedPrice: pricing.total,
      priceUnit: pricing.unit,
      serviceTitle: pricing.serviceTitle,
      lineItems: pricing.lineItems,
      emailsSent: false,
    };

    // Local JSON / SMTP are best-effort on Workers. Booking Broom is the
    // source of truth — fail the request if the forward does not succeed.
    const emailsSent = await sendBookingEmails(booking);
    booking.emailsSent = emailsSent;

    const savedLocally = await saveBooking(booking);
    if (!savedLocally) {
      console.info("[api/book] Local bookings.json skip for", booking.id);
    }

    const broom = await forwardToBookingBroom(booking, runtimeEnv, config);
    if (!broom.forwarded) {
      console.error("[api/book] Booking Broom forward failed:", broom.error);
      return new Response(
        JSON.stringify({
          ok: false,
          bookingId: booking.id,
          bookingBroom: false,
          error: broom.error ?? "Booking service is not configured",
        }),
        {
          status: broom.error?.includes("not configured") ? 503 : 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        id: broom.id,
        bookingId: booking.id,
        estimatedPrice: booking.estimatedPrice,
        priceUnit: booking.priceUnit,
        emailsSent,
        bookingBroom: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[api/book]", error);
    return new Response(JSON.stringify({ ok: false, error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
