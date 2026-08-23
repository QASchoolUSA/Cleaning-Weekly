/**
 * Forward a booking to Booking Broom (manager dashboard).
 * No-ops when BOOKING_BROOM_API_KEY is unset. URL defaults to production.
 */

import type { StoredBooking } from "./schemas";
import { formatTimeWindow } from "./schemas";
import { getServiceBySlug } from "../data/services";
import { sqftBandLabel } from "./sqft-bands";
import { DEFAULT_PRICING_CONFIG, type PricingConfig } from "../config/pricing";

export interface BookingBroomResult {
  forwarded: boolean;
  id?: string;
  error?: string;
}

/** Only what the structured property and quote fields cannot carry. */
function buildNotes(booking: StoredBooking): string {
  const parts: string[] = [];

  if (booking.notes) parts.push(booking.notes);
  parts.push(`Booking ID: ${booking.id}`);

  const structured = new Set(["bedrooms", "bathrooms", "sqft", "frequency"]);
  const extras = Object.entries(booking.pricingDetails)
    .filter(([key]) => !structured.has(key))
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .map(([key, value]) => `${fieldLabel(booking, key)}: ${optionLabel(booking, key, value)}`);
  if (extras.length > 0) {
    parts.push(extras.join("; "));
  }

  return parts.join("\n");
}

function pricingField(booking: StoredBooking, fieldId: string) {
  return getServiceBySlug(booking.serviceSlug)?.pricingFields.find(
    (f) => f.id === fieldId,
  );
}

function fieldLabel(booking: StoredBooking, fieldId: string): string {
  return pricingField(booking, fieldId)?.label ?? fieldId;
}

/** Selects store their value ("biweekly"); managers want the label ("Every 2 weeks"). */
function optionLabel(
  booking: StoredBooking,
  fieldId: string,
  value: string | number,
): string {
  const field = pricingField(booking, fieldId);
  const option = field?.options?.find((o) => o.value === String(value));
  return option?.label ?? String(value);
}

function numericDetail(booking: StoredBooking, fieldId: string): number | undefined {
  const value = booking.pricingDetails[fieldId];
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function buildProperty(booking: StoredBooking, pricing: PricingConfig) {
  const sqft = numericDetail(booking, "sqft");

  const property = {
    bedrooms: numericDetail(booking, "bedrooms"),
    bathrooms: numericDetail(booking, "bathrooms"),
    // The wizard collects a band, so report the band rather than its midpoint.
    size_label: sqft === undefined ? undefined : sqftBandLabel(sqft, pricing),
  };

  return Object.values(property).some((value) => value !== undefined)
    ? property
    : undefined;
}

const PAYMENT_TERMS: Record<StoredBooking["priceUnit"], string> = {
  week: "Billed weekly after each visit",
  visit: "Due after the cleaning is complete",
  project: "Due on project completion",
};

function buildQuote(booking: StoredBooking) {
  const frequency = booking.pricingDetails.frequency;

  return {
    estimate: booking.estimatedPrice,
    currency: "USD",
    service_level: booking.serviceTitle,
    frequency: frequency ? optionLabel(booking, "frequency", frequency) : undefined,
    // The priced breakdown, so it no longer has to be prose in `notes`.
    add_ons: booking.lineItems.length
      ? booking.lineItems.map((item) => ({ label: item.label, price: item.amount }))
      : undefined,
    payment_terms: PAYMENT_TERMS[booking.priceUnit],
  };
}

function env(name: string, runtimeEnv?: Record<string, unknown>): string | undefined {
  if (runtimeEnv && typeof runtimeEnv[name] === "string") {
    const value = runtimeEnv[name].trim();
    return value || undefined;
  }
  const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromImport?.trim()) return fromImport.trim();
  if (typeof process !== "undefined") {
    return process.env[name]?.trim() || undefined;
  }
  return undefined;
}

function getBookingBroomConfig(runtimeEnv?: Record<string, unknown>) {
  const baseUrl = (env("BOOKING_BROOM_URL", runtimeEnv) || "https://app.bookingbroom.com").replace(/\/$/, "");
  const apiKey = env("BOOKING_BROOM_API_KEY", runtimeEnv);
  const siteSlug = "cleaning-weekly";
  return { baseUrl, apiKey, siteSlug };
}

async function postToBookingBroom(
  payload: Record<string, unknown>,
  runtimeEnv?: Record<string, unknown>,
): Promise<BookingBroomResult> {
  const { baseUrl, apiKey, siteSlug } = getBookingBroomConfig(runtimeEnv);

  if (!baseUrl || !apiKey) {
    console.info(
      "[booking-broom] BOOKING_BROOM_API_KEY not set — skip forward",
    );
    return { forwarded: false, error: "Booking service is not configured" };
  }

  try {
    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site_slug: siteSlug,
        api_key: apiKey,
        ...payload,
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

export async function forwardToBookingBroom(
  booking: StoredBooking,
  runtimeEnv?: Record<string, unknown>,
  pricing: PricingConfig = DEFAULT_PRICING_CONFIG,
): Promise<BookingBroomResult> {
  return postToBookingBroom(
    {
      customer_name: booking.name,
      email: booking.email,
      phone: booking.phone,
      address: `${booking.streetAddress}, ${booking.city}`,
      service_type: booking.serviceTitle,
      preferred_date: booking.preferredDate,
      preferred_time: formatTimeWindow(booking.timeWindow),
      notes: buildNotes(booking),
      intent: "book",
      property: buildProperty(booking, pricing),
      quote: buildQuote(booking),
    },
    runtimeEnv,
  );
}

export type QuoteForwardInput = {
  name: string;
  email: string;
  phone?: string;
  serviceType: string;
  city: string;
  message?: string;
};

export async function forwardQuoteToBookingBroom(
  quote: QuoteForwardInput,
  runtimeEnv?: Record<string, unknown>,
): Promise<BookingBroomResult> {
  const notes = [quote.message?.trim(), `City: ${quote.city}`].filter(Boolean).join("\n");

  return postToBookingBroom(
    {
      customer_name: quote.name,
      email: quote.email,
      phone: quote.phone?.trim() || undefined,
      address: quote.city,
      service_type: quote.serviceType,
      notes: notes || undefined,
      intent: "quote",
    },
    runtimeEnv,
  );
}
