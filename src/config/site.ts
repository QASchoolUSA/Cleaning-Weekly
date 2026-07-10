/**
 * Site-wide SEO / NAP configuration.
 * Replace placeholder social URLs and phone when verified profiles are live.
 */
export const siteConfig = {
  name: "Cleaning Weekly",
  legalName: "Cleaning Weekly",
  tagline: "Affordable, local recurring cleaning across Central Florida.",
  description:
    "Affordable, reliable weekly cleaning for homes and offices across Central Florida. Insured, background-checked local teams. Get your free quote in minutes.",
  /** Production origin — no trailing slash */
  origin: "https://www.cleaningweekly.com",
  email: "hello@cleaningweekly.com",
  /** Display phone — update when a real number is assigned */
  telephoneDisplay: "(407) 555-0148",
  /** E.164 for schema / tel: links */
  telephoneE164: "+14075550148",
  address: {
    addressLocality: "Orlando",
    addressRegion: "FL",
    addressCountry: "US",
  },
  priceRange: "$$",
  sameAs: [
    "https://www.facebook.com/REPLACE_PROFILE",
    "https://www.instagram.com/REPLACE_PROFILE",
    "https://www.linkedin.com/company/REPLACE_PROFILE",
    "https://www.yelp.com/biz/REPLACE_PROFILE",
    "https://www.bbb.org/us/fl/REPLACE_BBB_PROFILE",
    "https://g.page/REPLACE_GOOGLE_BUSINESS_PROFILE",
  ],
  ogImagePath: "/og-default.svg",
  locale: "en_US",
} as const;

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.origin}${normalized === "/" ? "/" : normalized}`;
}
