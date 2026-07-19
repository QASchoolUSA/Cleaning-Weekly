/**
 * Site-wide SEO / NAP configuration.
 * Phone and sameAs stay empty until verified profiles / number are live.
 */
export const siteConfig = {
  name: "Cleaning Weekly",
  legalName: "Cleaning Weekly",
  tagline: "Affordable, local recurring cleaning across Central Florida.",
  description:
    "Affordable, reliable weekly cleaning for homes and offices across Central Florida. Insured, background-checked local teams. Get your free quote in minutes.",
  /** Production origin — apex host (no www). No trailing slash. */
  origin: "https://cleaningweekly.com",
  email: "hello@cleaningweekly.com",
  /**
   * Display phone — null until a real number is assigned.
   * Do not publish placeholder / 555 numbers in schema or UI.
   */
  telephoneDisplay: null as string | null,
  /** E.164 for schema / tel: links — null until real number is assigned */
  telephoneE164: null as string | null,
  address: {
    addressLocality: "Orlando",
    addressRegion: "FL",
    addressCountry: "US",
  },
  /** Service-area business: no public street address */
  serviceAreaPolicy:
    "Cleaning Weekly is a mobile, service-area business serving Central Florida. We do not publish a public storefront address.",
  priceRange: "$$",
  /** Only include verified profile URLs; empty until profiles exist */
  sameAs: [] as readonly string[],
  ogImagePath: "/og-default.png",
  locale: "en_US",
} as const;

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.origin}${normalized === "/" ? "/" : normalized}`;
}
