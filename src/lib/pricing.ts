import {
  pricingConfig,
  type DebrisLevel,
  type Frequency,
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
): PricingResult | null {
  const service = getServiceBySlug(serviceSlug);
  if (!service) return null;

  const lineItems: PricingLineItem[] = [];

  switch (serviceSlug) {
    case "home-cleaning": {
      const cfg = pricingConfig.homeCleaning;
      const bedrooms = num(details, "bedrooms", 3);
      const bathrooms = num(details, "bathrooms", 2);
      const sqft = num(details, "sqft", 1800);
      const frequency = str(details, "frequency", "weekly") as Frequency;

      lineItems.push({ label: "Base weekly rate", amount: cfg.base });
      if (bedrooms > 2) {
        lineItems.push({
          label: `Extra bedrooms (${bedrooms - 2})`,
          amount: (bedrooms - 2) * cfg.perBed,
        });
      }
      if (bathrooms > 2) {
        lineItems.push({
          label: `Extra bathrooms (${bathrooms - 2})`,
          amount: (bathrooms - 2) * cfg.perBath,
        });
      }
      const sqftBlocks = Math.max(0, Math.ceil((sqft - 1500) / 500));
      if (sqftBlocks > 0) {
        lineItems.push({
          label: `Additional square footage (${sqftBlocks} × 500 sq ft)`,
          amount: sqftBlocks * cfg.per500SqFt,
        });
      }
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const multiplier = cfg.frequency[frequency] ?? 1;
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
      const cfg = pricingConfig.officeCleaning;
      const sqft = num(details, "sqft", 2500);
      const restrooms = num(details, "restrooms", 2);
      const frequency = str(details, "frequency", "weekly") as Frequency;

      lineItems.push({ label: "Base weekly rate", amount: cfg.base });
      const sqftBlocks = Math.max(0, Math.ceil((sqft - 2000) / 500));
      if (sqftBlocks > 0) {
        lineItems.push({
          label: `Additional square footage (${sqftBlocks} × 500 sq ft)`,
          amount: sqftBlocks * cfg.per500SqFt,
        });
      }
      if (restrooms > 2) {
        lineItems.push({
          label: `Extra restrooms (${restrooms - 2})`,
          amount: (restrooms - 2) * cfg.perRestroom,
        });
      }
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const multiplier = cfg.frequency[frequency] ?? 1;
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
      const home = calculatePrice("home-cleaning", {
        ...details,
        frequency: "weekly",
      });
      if (!home) return null;
      const multiplier = pricingConfig.deepCleaning.multiplier;
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
      const cfg = pricingConfig.moveInOut;
      const bedrooms = num(details, "bedrooms", 3);
      const bathrooms = num(details, "bathrooms", 2);
      const sqft = num(details, "sqft", 1800);

      lineItems.push({ label: "Move-in/out base", amount: cfg.base });
      if (bedrooms > 2) {
        lineItems.push({
          label: `Extra bedrooms (${bedrooms - 2})`,
          amount: (bedrooms - 2) * cfg.perBed,
        });
      }
      if (bathrooms > 2) {
        lineItems.push({
          label: `Extra bathrooms (${bathrooms - 2})`,
          amount: (bathrooms - 2) * cfg.perBath,
        });
      }
      const sqftBlocks = Math.max(0, Math.ceil((sqft - 1500) / 500));
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
      const cfg = pricingConfig.postConstruction;
      const sqft = num(details, "sqft", 2200);
      const debris = str(details, "debris", "medium") as DebrisLevel;

      lineItems.push({ label: "Post-construction base", amount: cfg.base });
      const sqftBlocks = Math.max(0, Math.ceil((sqft - 2000) / 500));
      if (sqftBlocks > 0) {
        lineItems.push({
          label: `Additional square footage (${sqftBlocks} × 500 sq ft)`,
          amount: sqftBlocks * cfg.per500SqFt,
        });
      }
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const debrisMultiplier = cfg.debris[debris] ?? 1;
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
      const cfg = pricingConfig.airbnbTurnover;
      const bedrooms = num(details, "bedrooms", 2);
      const bathrooms = num(details, "bathrooms", 1);
      const turnovers = num(details, "turnovers", 8);

      lineItems.push({ label: "Per-turnover base", amount: cfg.base });
      if (bedrooms > 1) {
        lineItems.push({
          label: `Extra bedrooms (${bedrooms - 1})`,
          amount: (bedrooms - 1) * cfg.perBed,
        });
      }
      if (bathrooms > 1) {
        lineItems.push({
          label: `Extra bathrooms (${bathrooms - 1})`,
          amount: (bathrooms - 1) * cfg.perBath,
        });
      }
      let perVisit = lineItems.reduce((sum, item) => sum + item.amount, 0);
      if (turnovers > 4) {
        const discount = roundCurrency(perVisit * (1 - cfg.perTurnover));
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
