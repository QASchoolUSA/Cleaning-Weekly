/**
 * Square footage is answered as a band so the wizard stays one tap per question.
 * Pricing needs a number, so each band carries a midpoint, but the band label is
 * what gets reported to Booking Broom — the customer never gave an exact figure.
 */
import {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
  type SqftBand,
} from "../config/pricing";

export type { SqftBand };

export const SQFT_BANDS: SqftBand[] = DEFAULT_PRICING_CONFIG.sqftBands;

export function sqftBandFor(
  value: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): SqftBand {
  return config.sqftBands.reduce((closest, band) =>
    Math.abs(band.value - value) < Math.abs(closest.value - value) ? band : closest,
  );
}

export function sqftBandLabel(
  value: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
): string {
  return `${sqftBandFor(value, config).label} sq ft`;
}
