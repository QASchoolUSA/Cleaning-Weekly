/**
 * Square footage is answered as a band so the wizard stays one tap per question.
 * Pricing needs a number, so each band carries a midpoint, but the band label is
 * what gets reported to Booking Broom — the customer never gave an exact figure.
 */
export interface SqftBand {
  label: string;
  value: number;
}

export const SQFT_BANDS: SqftBand[] = [
  { label: "Under 1,000", value: 900 },
  { label: "1,000–1,500", value: 1250 },
  { label: "1,500–2,500", value: 2000 },
  { label: "2,500–4,000", value: 3200 },
  { label: "4,000+", value: 4500 },
];

export function sqftBandFor(value: number): SqftBand {
  return SQFT_BANDS.reduce((closest, band) =>
    Math.abs(band.value - value) < Math.abs(closest.value - value) ? band : closest,
  );
}

export function sqftBandLabel(value: number): string {
  return `${sqftBandFor(value).label} sq ft`;
}
