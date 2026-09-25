import {
  DEFAULT_PRICING_CONFIG,
  normalizeFrequency,
  serviceKeyForSlug,
  type PricingConfig,
} from "../config/pricing";
import { getServiceBySlug } from "../data/services";

export interface PricingLineItem {
  label: string;
  amount: number;
}

export interface PricingResult {
  total: number;
  unit: "week" | "visit" | "project";
  lineItems: PricingLineItem[];
  serviceSlug: string;
  serviceTitle: string;
}

export type PricingDetails = Record<string, string | number>;

function roundCurrency(value: number): number {
  return Math.round(value);
}

function num(details: PricingDetails, key: string, fallback = 0): number {
  const value = details[key];
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return fallback;
}

function str(details: PricingDetails, key: string, fallback = ""): string {
  const value = details[key];
  return typeof value === "string" ? value : fallback;
}

function unitForSlug(serviceSlug: string): PricingResult["unit"] {
  switch (serviceSlug) {
    case "home-cleaning":
    case "office-cleaning":
      return "week";
    case "deep-cleaning":
    case "airbnb-turnover":
      return "visit";
    default:
      return "project";
  }
}

/**
 * Maps the Astro wizard’s per-service fields onto the shared sqft-rate-min
 * formula (Davenport pattern): max(minBase, round(sqft×perSqft)) + beds×rate +
 * baths×rate, then × frequency.
 */
export function calculatePrice(
  serviceSlug: string,
  details: PricingDetails,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): PricingResult | null {
  const service = getServiceBySlug(serviceSlug);
  const serviceKey = serviceKeyForSlug(serviceSlug);
  if (!service || !serviceKey) return null;

  const rate = config.serviceRates.find((row) => row.key === serviceKey);
  if (!rate) return null;

  const sqft = Math.max(
    config.minSqft,
    Math.min(config.maxSqft, num(details, "sqft", 1600)),
  );
  const bedrooms = Math.max(0, Math.min(8, num(details, "bedrooms", 0)));
  const bathrooms = Math.max(
    1,
    Math.min(
      8,
      num(details, "bathrooms", 0) || num(details, "restrooms", 1) || 1,
    ),
  );

  const recurring =
    serviceSlug === "home-cleaning" || serviceSlug === "office-cleaning";
  const frequencyKey = normalizeFrequency(
    str(details, "frequency", recurring ? "weekly" : "one-time"),
  );
  const frequencyMultiplier =
    config.frequencyMultipliers.find((freq) => freq.key === frequencyKey)
      ?.multiplier ?? 1;

  const rawBase = sqft * rate.perSqft;
  const base = Math.max(rate.minBase, Math.round(rawBase));
  const bedroomCost = bedrooms * config.bedroomRate;
  const bathroomCost = bathrooms * config.bathroomRate;
  const subtotal = base + bedroomCost + bathroomCost;
  const total = roundCurrency(subtotal * frequencyMultiplier);

  const lineItems: PricingLineItem[] = [
    {
      label: `Base (${sqft} sq ft @ $${rate.perSqft}/sq ft, min $${rate.minBase})`,
      amount: base,
    },
  ];
  if (bedroomCost > 0) {
    lineItems.push({
      label: `Bedrooms (${bedrooms} × $${config.bedroomRate})`,
      amount: bedroomCost,
    });
  }
  lineItems.push({
    label: `Bathrooms (${bathrooms} × $${config.bathroomRate})`,
    amount: bathroomCost,
  });
  if (frequencyMultiplier !== 1) {
    lineItems.push({
      label: `Frequency (${frequencyKey})`,
      amount: total - subtotal,
    });
  }

  return {
    serviceSlug,
    serviceTitle: service.title,
    unit: unitForSlug(serviceSlug),
    total,
    lineItems,
  };
}

export function formatPrice(amount: number, unit: PricingResult["unit"]): string {
  const unitLabel =
    unit === "week" ? "/week" : unit === "visit" ? "/visit" : " total";
  return `$${amount}${unitLabel}`;
}
