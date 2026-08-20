export const prerender = false;

import type { APIRoute } from "astro";
import { forwardQuoteToBookingBroom } from "../../lib/booking-broom";
import { quoteRequestSchema, quoteServiceLabel } from "../../lib/quote-schema";
import { getRuntimeEnv } from "../../lib/runtime-env";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const parsed = quoteRequestSchema.safeParse(body);

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
    const runtimeEnv = await getRuntimeEnv(locals);
    const broom = await forwardQuoteToBookingBroom(
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        serviceType: quoteServiceLabel(payload.service),
        city: payload.city,
        message: payload.message,
      },
      runtimeEnv,
    );

    if (!broom.forwarded) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: broom.error ?? "Could not submit quote request. Please email us instead.",
        }),
        {
          status: broom.error?.includes("not configured") ? 503 : 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: broom.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[api/quote]", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Unexpected server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
