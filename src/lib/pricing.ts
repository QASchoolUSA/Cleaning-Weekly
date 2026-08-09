import {
  DEFAULT_PRICING_CONFIG,
  multiplierFor,
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

export function calculatePrice(
  serviceSlug: string,
  details: PricingDetails,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): PricingResult | null {
  const service = getServiceBySlug(serviceSlug);
  if (!service) return null;

  const lineItems: PricingLineItem[] = [];

  switch (serviceSlug) {
    case "home-cleaning": {
      const cfg = config.homeCleaning;
      const bedrooms = num(details, "bedrooms", 3);
      const bathrooms = num(details, "bathrooms", 2);
      const sqft = num(details, "sqft", 1800);
      const frequency = str(details, "frequency", "weekly");

      lineItems.push({ label: "Base weekly rate", amount: cfg.base });
      if (bedrooms > cfg.includedBedrooms) {
        lineItems.push({
          label: `Extra bedrooms (${bedrooms - cfg.includedBedrooms})`,
          amount: (bedrooms - cfg.includedBedrooms) * cfg.perBed,
        });
      }
      if (bathrooms > cfg.includedBathrooms) {
        lineItems.push({
          label: `Extra bathrooms (${bathrooms - cfg.includedBathrooms})`,
          amount: (bathrooms - cfg.includedBathrooms) * cfg.perBath,
        });
      }
      const sqftBlocks = Math.max(
        0,
        Math.ceil((sqft - cfg.includedSqFt) / 500),
      );
      if (sqftBlocks > 0) {
        lineItems.push({
          label: `Additional square footage (${sqftBlocks} × 500 sq ft)`,
          amount: sqftBlocks * cfg.per500SqFt,
        });
      }
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const multiplier = multiplierFor(cfg.frequencyMultipliers, frequency);
      if (multiplier !== 1) {
        lineItems.push({
          label: `Frequency adjustment (${frequency})`,
          amount: roundCurrency(subtotal * (multiplier - 1)),
        });
      }
      return {
        serviceSlug,
        serviceTitle: service.title,
        unit: "week",
        total: roundCurrency(subtotal * multiplier),
        lineItems,
      };
    }

    case "office-cleaning": {
      const cfg = config.officeCleaning;
      const sqft = num(details, "sqft", 2500);
      const restrooms = num(details, "restrooms", 2);
      const frequency = str(details, "frequency", "weekly");

      lineItems.push({ label: "Base weekly rate", amount: cfg.base });
      const sqftBlocks = Math.max(
        0,
        Math.ceil((sqft - cfg.includedSqFt) / 500),
      );
      if (sqftBlocks > 0) {
        lineItems.push({
          label: `Additional square footage (${sqftBlocks} × 500 sq ft)`,
          amount: sqftBlocks * cfg.per500SqFt,
        });
      }
      if (restrooms > cfg.includedRestrooms) {
        lineItems.push({
          label: `Extra restrooms (${restrooms - cfg.includedRestrooms})`,
          amount: (restrooms - cfg.includedRestrooms) * cfg.perRestroom,
        });
      }
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const multiplier = multiplierFor(cfg.frequencyMultipliers, frequency);
      if (multiplier !== 1) {
        lineItems.push({
          label: `Frequency adjustment (${frequency})`,
          amount: roundCurrency(subtotal * (multiplier - 1)),
        });
      }
      return {
        serviceSlug,
        serviceTitle: service.title,
        unit: "week",
        total: roundCurrency(subtotal * multiplier),
        lineItems,
      };
    }

    case "deep-cleaning": {
      const home = calculatePrice(
        "home-cleaning",
        { ...details, frequency: "weekly" },
        config,
      );
      if (!home) return null;
      const multiplier = config.deepCleaningMultiplier;
      return {
        serviceSlug,
        serviceTitle: service.title,
        unit: "visit",
        total: roundCurrency(home.total * multiplier),
        lineItems: [
          ...home.lineItems.map((item) => ({
            ...item,
            label: `${item.label} (deep clean basis)`,
          })),
          {
            label: "Deep clean intensity factor",
            amount: roundCurrency(home.total * (multiplier - 1)),
          },
        ],
      };
    }

    case "move-in-out": {
      const cfg = config.moveInOut;
      const bedrooms = num(details, "bedrooms", 3);
      const bathrooms = num(details, "bathrooms", 2);
      const sqft = num(details, "sqft", 1800);

      lineItems.push({ label: "Move-in/out base", amount: cfg.base });
      if (bedrooms > cfg.includedBedrooms) {
        lineItems.push({
          label: `Extra bedrooms (${bedrooms - cfg.includedBedrooms})`,
          amount: (bedrooms - cfg.includedBedrooms) * cfg.perBed,
        });
      }
      if (bathrooms > cfg.includedBathrooms) {
        lineItems.push({
          label: `Extra bathrooms (${bathrooms - cfg.includedBathrooms})`,
          amount: (bathrooms - cfg.includedBathrooms) * cfg.perBath,
        });
      }
      const sqftBlocks = Math.max(
        0,
        Math.ceil((sqft - cfg.includedSqFt) / 500),
      );
      if (sqftBlocks > 0) {
        lineItems.push({
          label: `Additional square footage (${sqftBlocks} × 500 sq ft)`,
          amount: sqftBlocks * cfg.per500SqFt,
        });
      }
      return {
        serviceSlug,
        serviceTitle: service.title,
        unit: "project",
        total: roundCurrency(lineItems.reduce((sum, item) => sum + item.amount, 0)),
        lineItems,
      };
    }

    case "post-construction": {
      const cfg = config.postConstruction;
      const sqft = num(details, "sqft", 2200);
      const debris = str(details, "debris", "medium");

      lineItems.push({ label: "Post-construction base", amount: cfg.base });
      const sqftBlocks = Math.max(
        0,
        Math.ceil((sqft - cfg.includedSqFt) / 500),
      );
      if (sqftBlocks > 0) {
        lineItems.push({
          label: `Additional square footage (${sqftBlocks} × 500 sq ft)`,
          amount: sqftBlocks * cfg.per500SqFt,
        });
      }
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const debrisMultiplier = multiplierFor(cfg.debrisMultipliers, debris);
      if (debrisMultiplier !== 1) {
        lineItems.push({
          label: `Debris level (${debris})`,
          amount: roundCurrency(subtotal * (debrisMultiplier - 1)),
        });
      }
      return {
        serviceSlug,
        serviceTitle: service.title,
        unit: "project",
        total: roundCurrency(subtotal * debrisMultiplier),
        lineItems,
      };
    }

    case "airbnb-turnover": {
      const cfg = config.airbnbTurnover;
      const bedrooms = num(details, "bedrooms", 2);
      const bathrooms = num(details, "bathrooms", 1);
      const turnovers = num(details, "turnovers", 8);

      lineItems.push({ label: "Per-turnover base", amount: cfg.base });
      if (bedrooms > cfg.includedBedrooms) {
        lineItems.push({
          label: `Extra bedrooms (${bedrooms - cfg.includedBedrooms})`,
          amount: (bedrooms - cfg.includedBedrooms) * cfg.perBed,
        });
      }
      if (bathrooms > cfg.includedBathrooms) {
        lineItems.push({
          label: `Extra bathrooms (${bathrooms - cfg.includedBathrooms})`,
          amount: (bathrooms - cfg.includedBathrooms) * cfg.perBath,
        });
      }
      let perVisit = lineItems.reduce((sum, item) => sum + item.amount, 0);
      if (turnovers > cfg.highVolumeThreshold) {
        const discount = roundCurrency(
          perVisit * (1 - cfg.highVolumeMultiplier),
        );
        lineItems.push({ label: "High-volume discount", amount: -discount });
        perVisit -= discount;
      }
      return {
        serviceSlug,
        serviceTitle: service.title,
        unit: "visit",
        total: roundCurrency(perVisit),
        lineItems,
      };
    }

    default:
      return null;
  }
}

export function formatPrice(amount: number, unit: PricingResult["unit"]): string {
  const unitLabel =
    unit === "week" ? "/week" : unit === "visit" ? "/visit" : " total";
  return `$${amount}${unitLabel}`;
}
