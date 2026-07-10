import { absoluteUrl, siteConfig } from "../config/site";
import { cities } from "../data/cities";
import { services, type ServiceDefinition } from "../data/services";

const orgId = `${siteConfig.origin}/#organization`;
const websiteId = `${siteConfig.origin}/#website`;
const serviceId = `${siteConfig.origin}/#professionalservice`;

function areaServedNodes() {
  return [
    ...cities.map((city) => ({
      "@type": "City" as const,
      name: city.name,
      containedInPlace: { "@type": "State" as const, name: "Florida" },
    })),
    {
      "@type": "AdministrativeArea" as const,
      name: "Central Florida",
      containedInPlace: { "@type": "State" as const, name: "Florida" },
    },
  ];
}

function priceUnitText(unit: ServiceDefinition["priceUnit"]): string {
  if (unit === "week") return "WEEK";
  if (unit === "visit") return "VISIT";
  return "PROJECT";
}

export function organizationGraph() {
  return {
    "@type": "Organization",
    "@id": orgId,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: `${siteConfig.origin}/`,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/favicon.svg"),
    },
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.telephoneE164,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.address.addressLocality,
      addressRegion: siteConfig.address.addressRegion,
      addressCountry: siteConfig.address.addressCountry,
    },
    areaServed: areaServedNodes(),
    sameAs: [...siteConfig.sameAs],
    knowsAbout: [
      "Weekly house cleaning",
      "Apartment cleaning",
      "Office cleaning",
      "Commercial cleaning",
      "Move-out cleaning",
      "Airbnb turnover cleaning",
      "Post-construction cleaning",
      "Deep cleaning",
      "Central Florida cleaning services",
    ],
  };
}

export function websiteGraph() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    url: `${siteConfig.origin}/`,
    name: siteConfig.name,
    description: siteConfig.tagline,
    publisher: { "@id": orgId },
    inLanguage: "en-US",
    about: [
      {
        "@type": "Thing",
        name: "Local Recurring Cleaning Service",
        sameAs: "https://en.wikipedia.org/wiki/Cleaning",
      },
      {
        "@type": "Thing",
        name: "Housekeeping",
        sameAs: "https://en.wikipedia.org/wiki/Housekeeping",
      },
      { "@type": "Place", name: "Central Florida" },
    ],
    mentions: [
      { "@type": "Thing", name: "Residential Recurring House Cleaning" },
      { "@type": "Thing", name: "Commercial and Office Cleaning" },
      { "@type": "Thing", name: "Short-Term Rental Turnover Cleaning" },
      { "@type": "Thing", name: "Vacancy and Transition Cleaning" },
      { "@type": "Thing", name: "Specialized Reset Cleaning" },
      ...cities.map((city) => ({ "@type": "City" as const, name: city.name })),
    ],
  };
}

export function professionalServiceGraph() {
  return {
    "@type": "ProfessionalService",
    "@id": serviceId,
    name: `${siteConfig.name} — Central Florida Cleaning Services`,
    url: `${siteConfig.origin}/`,
    image: absoluteUrl(siteConfig.ogImagePath),
    provider: { "@id": orgId },
    priceRange: siteConfig.priceRange,
    telephone: siteConfig.telephoneE164,
    currenciesAccepted: "USD",
    paymentAccepted: "Credit Card, Debit Card",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    areaServed: areaServedNodes(),
    serviceType: services.map((s) => s.title),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${siteConfig.name} Services`,
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          url: absoluteUrl(`/services/${service.slug}`),
          description: service.description,
        },
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "USD",
          minPrice: String(service.startingPrice),
          unitText: priceUnitText(service.priceUnit),
        },
      })),
    },
    about: [
      { "@type": "Thing", name: "Local Recurring Cleaning Service" },
      { "@type": "Thing", name: "Residential Recurring House Cleaning" },
      { "@type": "Thing", name: "Commercial and Office Cleaning" },
      { "@type": "Thing", name: "Short-Term Rental Turnover Cleaning" },
      { "@type": "Thing", name: "Vacancy and Transition Cleaning" },
      { "@type": "Thing", name: "Specialized Reset Cleaning" },
    ],
    mentions: [
      { "@type": "Thing", name: "House Cleaning" },
      { "@type": "Thing", name: "Apartment Cleaning" },
      { "@type": "Thing", name: "Turnover Cleaning" },
      { "@type": "Thing", name: "Move Out Cleaning" },
      { "@type": "Thing", name: "Post Construction Cleaning" },
      { "@type": "Thing", name: "Airbnb Cleaning" },
      { "@type": "Thing", name: "Commercial Cleaning" },
      { "@type": "Thing", name: "Office Cleaning" },
      ...cities.map((city) => ({ "@type": "City" as const, name: city.name })),
    ],
    sameAs: [...siteConfig.sameAs],
  };
}

/** Global graph for every page (Organization + WebSite + ProfessionalService). */
export function siteWideJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationGraph(), websiteGraph(), professionalServiceGraph()],
  };
}

export function servicePageJsonLd(service: ServiceDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: { "@id": orgId },
    areaServed: areaServedNodes(),
    offers: {
      "@type": "Offer",
      price: service.startingPrice,
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "PriceSpecification",
        priceCurrency: "USD",
        minPrice: String(service.startingPrice),
        unitText: priceUnitText(service.priceUnit),
      },
    },
  };
}

export function cityServiceJsonLd(
  cityName: string,
  service: ServiceDefinition,
  pagePath: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${service.title} in ${cityName}`,
    description: `${service.description} Serving ${cityName}, Central Florida.`,
    url: absoluteUrl(pagePath),
    provider: { "@id": orgId },
    areaServed: {
      "@type": "City",
      name: cityName,
      containedInPlace: { "@type": "State", name: "Florida" },
    },
    offers: {
      "@type": "Offer",
      price: service.startingPrice,
      priceCurrency: "USD",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function techArticleJsonLd(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  about: { "@type": string; name: string }[];
  mentions: { "@type": string; name?: string; "@id"?: string }[];
  keywords: string[];
}) {
  const pageUrl = absoluteUrl(opts.path);
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${pageUrl}#article`,
    headline: opts.headline,
    name: opts.headline,
    description: opts.description,
    url: pageUrl,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    author: { "@id": orgId },
    publisher: { "@id": orgId },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    about: opts.about,
    mentions: opts.mentions,
    keywords: opts.keywords,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".ai-overview-target", "h1", "h2"],
    },
  };
}

export { orgId, websiteId, serviceId };
