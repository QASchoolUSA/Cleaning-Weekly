export interface CityDefinition {
  slug: string;
  name: string;
  /** Short phrase for hero / meta */
  regionLabel: string;
  /** Neighborhoods / nearby areas for local copy */
  neighborhoods: string[];
  /** Pricing band note for guides (relative to Orlando core) */
  pricingNote: string;
}

export const cities: CityDefinition[] = [
  {
    slug: "orlando",
    name: "Orlando",
    regionLabel: "Orlando & metro core",
    neighborhoods: ["Downtown", "College Park", "Baldwin Park", "Lake Nona", "Dr. Phillips"],
    pricingNote: "Orlando core rates are the baseline for Central Florida quotes.",
  },
  {
    slug: "winter-park",
    name: "Winter Park",
    regionLabel: "Winter Park",
    neighborhoods: ["Park Avenue", "Via Tuscany", "Orwin Manor", "Windsong"],
    pricingNote: "Winter Park homes often quote near Orlando core, with larger sqft homes trending higher.",
  },
  {
    slug: "kissimmee",
    name: "Kissimmee",
    regionLabel: "Kissimmee",
    neighborhoods: ["Downtown Kissimmee", "Celebration area", "Poinciana corridor"],
    pricingNote: "Kissimmee quotes track Orlando closely; vacation-rental density raises turnover demand.",
  },
  {
    slug: "sanford",
    name: "Sanford",
    regionLabel: "Sanford",
    neighborhoods: ["Historic Sanford", "Lake Mary corridor", "Heathrow area"],
    pricingNote: "Sanford and north-corridor homes typically match Orlando weekly bands.",
  },
  {
    slug: "apopka",
    name: "Apopka",
    regionLabel: "Apopka",
    neighborhoods: ["Downtown Apopka", "Wekiva Springs edge", "Plymouth Sorrento"],
    pricingNote: "Apopka quotes usually sit in the same weekly bands as Orlando metro.",
  },
  {
    slug: "oviedo",
    name: "Oviedo",
    regionLabel: "Oviedo",
    neighborhoods: ["Downtown Oviedo", "Twin Rivers", "Live Oak"],
    pricingNote: "Oviedo and east-corridor rates align with Orlando; larger family homes push toward the upper band.",
  },
];

export function getCityBySlug(slug: string): CityDefinition | undefined {
  return cities.find((city) => city.slug === slug);
}

export function isValidCitySlug(slug: string): boolean {
  return cities.some((city) => city.slug === slug);
}
