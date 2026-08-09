export type Frequency = "weekly" | "biweekly" | "monthly";
export type DebrisLevel = "light" | "medium" | "heavy";
export type TimeWindow = "morning" | "afternoon" | "flexible";

export interface LabelledMultiplier {
  key: string;
  label: string;
  multiplier: number;
}

export interface SqftBand {
  label: string;
  value: number;
}

/**
 * Every number the quote engine uses. Booking Broom stores this same shape per
 * site, so an edit there arrives here whole rather than as a patch.
 */
export interface PricingConfig {
  kind: "per-service-branch";
  homeCleaning: {
    base: number;
    perBed: number;
    perBath: number;
    per500SqFt: number;
    includedBedrooms: number;
    includedBathrooms: number;
    includedSqFt: number;
    frequencyMultipliers: LabelledMultiplier[];
  };
  officeCleaning: {
    base: number;
    per500SqFt: number;
    perRestroom: number;
    includedRestrooms: number;
    includedSqFt: number;
    frequencyMultipliers: LabelledMultiplier[];
  };
  /** Applied to a weekly home clean. */
  deepCleaningMultiplier: number;
  moveInOut: {
    base: number;
    perBed: number;
    perBath: number;
    per500SqFt: number;
    includedBedrooms: number;
    includedBathrooms: number;
    includedSqFt: number;
  };
  postConstruction: {
    base: number;
    per500SqFt: number;
    includedSqFt: number;
    debrisMultipliers: LabelledMultiplier[];
  };
  airbnbTurnover: {
    base: number;
    perBed: number;
    perBath: number;
    includedBedrooms: number;
    includedBathrooms: number;
    /** Charged per visit once the monthly turnover count passes the threshold. */
    highVolumeMultiplier: number;
    highVolumeThreshold: number;
  };
  sqftBands: SqftBand[];
}

/** The prices this build ships with, and the fallback when Booking Broom is unreachable. */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  kind: "per-service-branch",
  homeCleaning: {
    base: 129,
    perBed: 15,
    perBath: 10,
    per500SqFt: 12,
    includedBedrooms: 2,
    includedBathrooms: 2,
    includedSqFt: 1500,
    frequencyMultipliers: [
      { key: "weekly", label: "Weekly", multiplier: 1 },
      { key: "biweekly", label: "Every other week", multiplier: 1.15 },
      { key: "monthly", label: "Monthly", multiplier: 1.35 },
    ],
  },
  officeCleaning: {
    base: 199,
    per500SqFt: 18,
    perRestroom: 25,
    includedRestrooms: 2,
    includedSqFt: 2000,
    frequencyMultipliers: [
      { key: "weekly", label: "Weekly", multiplier: 1 },
      { key: "biweekly", label: "Every other week", multiplier: 1.12 },
      { key: "monthly", label: "Monthly", multiplier: 1.3 },
    ],
  },
  deepCleaningMultiplier: 1.8,
  moveInOut: {
    base: 249,
    perBed: 25,
    perBath: 20,
    per500SqFt: 18,
    includedBedrooms: 2,
    includedBathrooms: 2,
    includedSqFt: 1500,
  },
  postConstruction: {
    base: 299,
    per500SqFt: 22,
    includedSqFt: 2000,
    debrisMultipliers: [
      { key: "light", label: "Light debris", multiplier: 1 },
      { key: "medium", label: "Medium debris", multiplier: 1.25 },
      { key: "heavy", label: "Heavy debris", multiplier: 1.55 },
    ],
  },
  airbnbTurnover: {
    base: 119,
    perBed: 12,
    perBath: 10,
    includedBedrooms: 1,
    includedBathrooms: 1,
    highVolumeMultiplier: 0.92,
    highVolumeThreshold: 4,
  },
  sqftBands: [
    { label: "Under 1,000", value: 900 },
    { label: "1,000–1,500", value: 1250 },
    { label: "1,500–2,500", value: 2000 },
    { label: "2,500–4,000", value: 3200 },
    { label: "4,000+", value: 4500 },
  ],
};

/**
 * Guards a config that arrived over the wire. Only checks enough to know the
 * engine can run on it — a wrong-shaped payload must fall back rather than
 * quote $0.
 */
export function isUsablePricingConfig(value: unknown): value is PricingConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<PricingConfig>;
  if (config.kind !== "per-service-branch") return false;
  if (typeof config.deepCleaningMultiplier !== "number") return false;
  if (typeof config.homeCleaning?.base !== "number") return false;
  if (typeof config.officeCleaning?.base !== "number") return false;
  if (typeof config.moveInOut?.base !== "number") return false;
  if (typeof config.postConstruction?.base !== "number") return false;
  if (typeof config.airbnbTurnover?.base !== "number") return false;
  if (!Array.isArray(config.homeCleaning?.frequencyMultipliers)) return false;
  if (!Array.isArray(config.sqftBands) || config.sqftBands.length === 0) {
    return false;
  }
  return true;
}

export function multiplierFor(
  multipliers: LabelledMultiplier[],
  key: string,
): number {
  return multipliers.find((m) => m.key === key)?.multiplier ?? 1;
}

/**
 * The cheapest a service can quote: the base with nothing above the included
 * bedrooms, bathrooms and square footage. This is the "from $X" figure the
 * marketing pages advertise, derived so it can never contradict the calculator.
 */
export function startingPriceFor(
  serviceSlug: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): number {
  switch (serviceSlug) {
    case "home-cleaning":
      return config.homeCleaning.base;
    case "office-cleaning":
      return config.officeCleaning.base;
    case "deep-cleaning":
      return Math.round(config.homeCleaning.base * config.deepCleaningMultiplier);
    case "move-in-out":
      return config.moveInOut.base;
    case "post-construction":
      return config.postConstruction.base;
    case "airbnb-turnover":
      return config.airbnbTurnover.base;
    default:
      return 0;
  }
}
