import nodemailer from "nodemailer";
import type { StoredBooking } from "./schemas";
import { formatPrice } from "./pricing";
import { formatTimeWindow } from "./schemas";

function smtpConfigured(): boolean {
  return Boolean(
    import.meta.env.SMTP_HOST &&
      import.meta.env.SMTP_USER &&
      import.meta.env.SMTP_PASS &&
      import.meta.env.MAIL_FROM,
  );
}

function createTransport() {
  const port = Number(import.meta.env.SMTP_PORT || 587);
  const secure =
    import.meta.env.SMTP_SECURE === "true" || import.meta.env.SMTP_SECURE === "1";

  return nodemailer.createTransport({
    host: import.meta.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: import.meta.env.SMTP_USER,
      pass: import.meta.env.SMTP_PASS,
    },
  });
}

function lineItemsHtml(booking: StoredBooking): string {
  return booking.lineItems
    .map(
      (item) =>
        `<tr><td style="padding:4px 0;color:#444;">${item.label}</td><td style="padding:4px 0;text-align:right;font-family:monospace;">$${item.amount}</td></tr>`,
    )
    .join("");
}

export async function sendBookingEmails(booking: StoredBooking): Promise<boolean> {
  if (!smtpConfigured()) {
    console.info("[mail] SMTP not configured — booking saved, emails skipped:", booking.id);
    return false;
  }

  const transport = createTransport();
  const from = import.meta.env.MAIL_FROM as string;
  const adminEmail = import.meta.env.ADMIN_EMAIL as string | undefined;
  const priceLabel = formatPrice(booking.estimatedPrice, booking.priceUnit);
  const schedule = `${booking.preferredDate} · ${formatTimeWindow(booking.timeWindow)}`;

  await transport.sendMail({
    from,
    to: booking.email,
    subject: `Booking confirmed — ${booking.id} | Cleaning Weekly`,
    html: `
      <div style="font-family:Figtree,Helvetica,sans-serif;max-width:560px;color:#1a3335;">
        <h1 style="font-family:Spectral,Georgia,serif;font-size:24px;margin:0 0 16px;">You are booked, ${booking.name.split(" ")[0]}!</h1>
        <p style="margin:0 0 16px;line-height:1.5;">Thanks for choosing Cleaning Weekly. Here is your booking summary:</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
          <tr><td style="padding:4px 0;"><strong>Booking ID</strong></td><td style="padding:4px 0;text-align:right;font-family:monospace;">${booking.id}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Service</strong></td><td style="padding:4px 0;text-align:right;">${booking.serviceTitle}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Estimate</strong></td><td style="padding:4px 0;text-align:right;font-family:monospace;">${priceLabel}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Preferred start</strong></td><td style="padding:4px 0;text-align:right;">${schedule}</td></tr>
          <tr><td style="padding:4px 0;"><strong>Address</strong></td><td style="padding:4px 0;text-align:right;">${booking.streetAddress}, ${booking.city}</td></tr>
        </table>
        <p style="margin:0 0 8px;font-weight:600;">Price breakdown</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">${lineItemsHtml(booking)}</table>
        <p style="margin:0;line-height:1.5;color:#444;">We will confirm your exact arrival window within one business day. Questions? Reply to this email or call us.</p>
        <p style="margin:16px 0 0;font-size:14px;color:#666;">Cleaning Weekly · Central Florida</p>
      </div>
    `,
  });

  if (adminEmail) {
    await transport.sendMail({
      from,
      to: adminEmail,
      subject: `New booking ${booking.id} — ${booking.serviceTitle}`,
      html: `
        <div style="font-family:Figtree,Helvetica,sans-serif;max-width:640px;color:#111;">
          <h1 style="font-size:20px;margin:0 0 12px;">New booking received</h1>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;"><strong>ID</strong></td><td style="font-family:monospace;">${booking.id}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Service</strong></td><td>${booking.serviceTitle}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Estimate</strong></td><td style="font-family:monospace;">${priceLabel}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Schedule</strong></td><td>${schedule}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Customer</strong></td><td>${booking.name}</td></tr>
            <tr><td style="padding:6px 0;"><strong>Email</strong></td><td><a href="mailto:${booking.email}">${booking.email}</a></td></tr>
            <tr><td style="padding:6px 0;"><strong>Phone</strong></td><td><a href="tel:${booking.phone}">${booking.phone}</a></td></tr>
            <tr><td style="padding:6px 0;"><strong>Address</strong></td><td>${booking.streetAddress}, ${booking.city}</td></tr>
            <tr><td style="padding:6px 0;vertical-align:top;"><strong>Notes</strong></td><td>${booking.notes || "—"}</td></tr>
            <tr><td style="padding:6px 0;vertical-align:top;"><strong>Details</strong></td><td><pre style="margin:0;font-size:12px;">${JSON.stringify(booking.pricingDetails, null, 2)}</pre></td></tr>
          </table>
        </div>
      `,
    });
  } else {
    console.warn("[mail] ADMIN_EMAIL not set — admin notification skipped");
  }

  return true;
}
