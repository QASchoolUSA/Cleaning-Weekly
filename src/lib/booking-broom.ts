/**
 * Forward a booking to Booking Broom (manager dashboard).
 * No-ops when BOOKING_BROOM_URL / BOOKING_BROOM_API_KEY are unset.
 */

import type { StoredBooking } from "./schemas";
import { formatTimeWindow } from "./schemas";
import { formatPrice } from "./pricing";

export interface BookingBroomResult {
  forwarded: boolean;
  id?: string;
  error?: string;
}

function buildNotes(booking: StoredBooking): string {
  const parts: string[] = [];

  if (booking.notes) parts.push(booking.notes);

  parts.push(`Booking ID: ${booking.id}`);
  parts.push(`Estimate: ${formatPrice(booking.estimatedPrice, booking.priceUnit)}`);

  if (booking.lineItems.length > 0) {
    parts.push(
      "Line items: " +
        booking.lineItems.map((item) => `${item.label} ($${item.amount})`).join("; "),
    );
  }

  const details = Object.entries(booking.pricingDetails)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .map(([key, value]) => `${key}: ${value}`);
  if (details.length > 0) {
    parts.push("Details: " + details.join("; "));
  }

  return parts.join("\n");
}

function env(name: string): string | undefined {
  const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromImport) return fromImport;
  if (typeof process !== "undefined") {
    return process.env[name];
  }
  return undefined;
}

export async function forwardToBookingBroom(
  booking: StoredBooking,
): Promise<BookingBroomResult> {
  const baseUrl = env("BOOKING_BROOM_URL")?.replace(/\/$/, "");
  const apiKey = env("BOOKING_BROOM_API_KEY");
  const siteSlug = env("BOOKING_BROOM_SITE_SLUG") || "cleaning-weekly";

  if (!baseUrl || !apiKey) {
    console.info(
      "[booking-broom] BOOKING_BROOM_URL / BOOKING_BROOM_API_KEY not set — skip forward",
    );
    return { forwarded: false };
  }

  try {
    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_slug: siteSlug,
        api_key: apiKey,
        customer_name: booking.name,
        email: booking.email,
        phone: booking.phone,
        address: `${booking.streetAddress}, ${booking.city}`,
        service_type: booking.serviceTitle,
        preferred_date: booking.preferredDate,
        preferred_time: formatTimeWindow(booking.timeWindow),
        notes: buildNotes(booking),
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      const error = data.error ?? `HTTP ${response.status}`;
      console.error("[booking-broom] forward failed:", error);
      return { forwarded: false, error };
    }

    const data = (await response.json()) as { id?: string };
    return { forwarded: true, id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[booking-broom] forward error:", message);
    return { forwarded: false, error: message };
  }
}
