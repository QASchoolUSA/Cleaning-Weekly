import type { StoredBooking } from "./schemas";

/**
 * SMTP via nodemailer is not available on Cloudflare Workers (no Node net/tls).
 * Keep this as a soft no-op so the booking API stays Workers-safe.
 * Customer/admin notifications should go through Booking Broom or a
 * Workers-compatible mail API (e.g. Resend / Mailchannels) later.
 */
export async function sendBookingEmails(booking: StoredBooking): Promise<boolean> {
  console.info(
    "[mail] SMTP/nodemailer skipped on this runtime — booking continues:",
    booking.id,
  );
  return false;
}
