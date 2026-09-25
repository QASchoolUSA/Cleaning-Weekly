export type Frequency = "weekly" | "biweekly" | "monthly" | "one-time";
export type TimeWindow = "morning" | "afternoon" | "flexible";

export type ServiceTypeId =
  | "house"
  | "apartment"
  | "move"
  | "airbnb"
  | "post-construction"
  | "maintenance"
  | "deep";

export interface SqftBand {
  label: string;
  value: number;
}

/**
 * Every number this site charges. Booking Broom is the source of truth; the
 * values below are used whenever the dashboard cannot be reached.
 */
export interface PricingConfig {
  kind: "sqft-rate-min";
  serviceRates: { key: string; perSqft: number; minBase: number }[];
  bedroomRate: number;
  bathroomRate: number;
  frequencyMultipliers: { key: string; label: string; multiplier: number }[];
  addOns: { key: string; label: string; price: number }[];
  sqftPresets: SqftBand[];
  minSqft: number;
  maxSqft: number;
}

/** STANDARD (list) rates — not the discounted Davenport seed numbers. */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  kind: "sqft-rate-min",
  serviceRates: [
    { key: "house", perSqft: 0.15, minBase: 129 },
    { key: "apartment", perSqft: 0.15, minBase: 99 },
    { key: "maintenance", perSqft: 0.15, minBase: 109 },
    { key: "deep", perSqft: 0.2, minBase: 199 },
    { key: "move", perSqft: 0.23, minBase: 189 },
    { key: "airbnb", perSqft: 0.12, minBase: 149 },
    { key: "post-construction", perSqft: 0.39, minBase: 249 },
  ],
  bedroomRate: 18,
  bathroomRate: 28,
  frequencyMultipliers: [
    { key: "one-time", label: "One-time", multiplier: 1 },
    { key: "weekly", label: "Weekly", multiplier: 0.85 },
    { key: "bi-weekly", label: "Bi-weekly", multiplier: 0.9 },
    { key: "monthly", label: "Monthly", multiplier: 0.95 },
  ],
  addOns: [
    { key: "kitchen-deep", label: "Kitchen deep clean", price: 45 },
    { key: "oven", label: "Oven cleaning", price: 35 },
    { key: "fridge", label: "Fridge cleaning", price: 35 },
    { key: "windows-interior", label: "Windows (interior)", price: 40 },
    { key: "windows-exterior", label: "Windows (exterior)", price: 55 },
    { key: "laundry", label: "Laundry fold & put away", price: 25 },
    { key: "cabinets", label: "Inside cabinets", price: 40 },
    { key: "garage", label: "Garage sweep & wipe", price: 50 },
    { key: "balcony", label: "Patio / balcony", price: 30 },
    { key: "pets", label: "Pet-friendly detail", price: 20 },
  ],
  sqftPresets: [
    { label: "Under 800 sq ft", value: 600 },
    { label: "800–1,200 sq ft", value: 1000 },
    { label: "1,200–2,000 sq ft", value: 1600 },
    { label: "2,000–2,600 sq ft", value: 2200 },
    { label: "2,600+ sq ft", value: 3000 },
  ],
  minSqft: 400,
  maxSqft: 6000,
};

const SERVICE_TYPE_IDS: ServiceTypeId[] = [
  "house",
  "apartment",
  "move",
  "airbnb",
  "post-construction",
  "maintenance",
  "deep",
];

const FREQUENCY_IDS = ["one-time", "weekly", "bi-weekly", "monthly"] as const;

const ADDON_IDS = [
  "kitchen-deep",
  "oven",
  "fridge",
  "windows-interior",
  "windows-exterior",
  "laundry",
  "cabinets",
  "garage",
  "balcony",
  "pets",
] as const;

/** Marketing service slug → sqft-rate-min service key. */
export function serviceKeyForSlug(slug: string): ServiceTypeId | null {
  switch (slug) {
    case "home-cleaning":
      return "maintenance";
    case "office-cleaning":
      return "house";
    case "deep-cleaning":
      return "deep";
    case "move-in-out":
      return "move";
    case "post-construction":
      return "post-construction";
    case "airbnb-turnover":
      return "airbnb";
    default:
      return null;
  }
}

/** Wizard uses `biweekly`; engine/config uses `bi-weekly`. */
export function normalizeFrequency(raw: string): string {
  if (raw === "biweekly") return "bi-weekly";
  return raw;
}

export function isUsablePricingConfig(value: unknown): value is PricingConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<PricingConfig>;
  if (config.kind !== "sqft-rate-min") return false;
  if (typeof config.bedroomRate !== "number") return false;
  if (typeof config.bathroomRate !== "number") return false;
  if (typeof config.minSqft !== "number") return false;
  if (typeof config.maxSqft !== "number") return false;
  if (!Array.isArray(config.sqftPresets) || config.sqftPresets.length === 0) {
    return false;
  }
  if (!Array.isArray(config.serviceRates)) return false;
  if (!Array.isArray(config.frequencyMultipliers)) return false;
  if (!Array.isArray(config.addOns)) return false;

  return (
    SERVICE_TYPE_IDS.every((id) =>
      config.serviceRates!.some((rate) => rate.key === id),
    ) &&
    FREQUENCY_IDS.every((id) =>
      config.frequencyMultipliers!.some((freq) => freq.key === id),
    ) &&
    ADDON_IDS.every((id) => config.addOns!.some((addOn) => addOn.key === id))
  );
}

export function minimumBase(
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): Record<ServiceTypeId, number> {
  return Object.fromEntries(
    config.serviceRates.map((rate) => [rate.key, rate.minBase]),
  ) as Record<ServiceTypeId, number>;
}

/**
 * The cheapest a service can quote — the published "from $X" for marketing pages.
 */
export function startingPriceFor(
  serviceSlug: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): number {
  const key = serviceKeyForSlug(serviceSlug);
  if (!key) return 0;
  return minimumBase(config)[key] ?? 0;
}
