import type { StoredBooking } from "./schemas";

/**
 * Local JSON persistence is Node-only. Cloudflare Workers have no writable
 * filesystem, so this is intentionally a no-op. Production persistence is
 * Booking Broom (BOOKING_BROOM_URL / BOOKING_BROOM_API_KEY).
 */
export async function saveBooking(booking: StoredBooking): Promise<boolean> {
  console.info(
    "[bookings] Skipping local file save (Workers-compatible runtime):",
    booking.id,
  );
  return false;
}

export function generateBookingId(): string {
  const date = new Date();
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CW-${ymd}-${suffix}`;
}
