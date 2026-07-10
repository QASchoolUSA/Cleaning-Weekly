export type PricingFieldType = "number" | "select";

export interface PricingFieldOption {
  value: string;
  label: string;
}

export interface PricingField {
  id: string;
  label: string;
  type: PricingFieldType;
  min?: number;
  max?: number;
  step?: number;
  defaultValue: string | number;
  options?: PricingFieldOption[];
  required?: boolean;
}

export interface ServiceDefinition {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  metaDescription: string;
  heroImage: string;
  heroAlt: string;
  startingPrice: number;
  priceUnit: "week" | "visit" | "project";
  includedItems: string[];
  faq: { question: string; answer: string }[];
  pricingFields: PricingField[];
}

export const services: ServiceDefinition[] = [
  {
    slug: "home-cleaning",
    title: "Home Cleaning",
    shortTitle: "Home",
    description:
      "Recurring weekly home cleaning for kitchens, bathrooms, floors, and the details that pile up between weekends.",
    metaDescription:
      "Weekly home cleaning across Central Florida. Transparent pricing, same trusted team every visit. Get an instant quote.",
    heroImage:
      "https://images.unsplash.com/photo-1770584427107-d1649242c2b1?auto=format&fit=crop&w=1400&q=80",
    heroAlt: "Bright, tidy living room with natural light after a weekly clean",
    startingPrice: 129,
    priceUnit: "week",
    includedItems: [
      "Kitchen counters, sinks, and appliance fronts",
      "Bathroom fixtures, mirrors, and floors",
      "Vacuum and mop all main living areas",
      "Dusting reachable surfaces and baseboards",
      "Trash emptied from main bins",
    ],
    faq: [
      {
        question: "Do I need to be home during the clean?",
        answer:
          "No. Many customers provide entry instructions after the first visit. We are insured and background-checked.",
      },
      {
        question: "Can I skip a week or pause service?",
        answer:
          "Yes. Give us 48 hours notice to skip or pause. No penalty for reasonable schedule changes.",
      },
    ],
    pricingFields: [
      {
        id: "bedrooms",
        label: "Bedrooms",
        type: "number",
        min: 1,
        max: 8,
        defaultValue: 3,
      },
      {
        id: "bathrooms",
        label: "Bathrooms",
        type: "number",
        min: 1,
        max: 6,
        defaultValue: 2,
      },
      {
        id: "sqft",
        label: "Square footage",
        type: "number",
        min: 500,
        max: 8000,
        step: 100,
        defaultValue: 1800,
      },
      {
        id: "frequency",
        label: "Frequency",
        type: "select",
        defaultValue: "weekly",
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "biweekly", label: "Every 2 weeks" },
          { value: "monthly", label: "Monthly" },
        ],
      },
    ],
  },
  {
    slug: "office-cleaning",
    title: "Office Cleaning",
    shortTitle: "Office",
    description:
      "Fixed weekly office cleaning for reception areas, workspaces, break rooms, and restrooms on a dependable schedule.",
    metaDescription:
      "Commercial office cleaning in Central Florida. One team, one invoice, transparent weekly rates. Book online.",
    heroImage:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
    heroAlt: "Clean, modern office workspace ready for the week ahead",
    startingPrice: 199,
    priceUnit: "week",
    includedItems: [
      "Reception and common area cleaning",
      "Workstation surface wipe-down",
      "Break room counters, sinks, and floors",
      "Restroom restock and sanitizing",
      "Trash and recycling removal",
    ],
    faq: [
      {
        question: "Do you clean after business hours?",
        answer:
          "Yes. We schedule most office accounts before opening or after close. Tell us your preferred window when booking.",
      },
      {
        question: "Can you handle multi-suite buildings?",
        answer:
          "Yes. We quote by total square footage and restroom count. Send your floor plan in the notes if helpful.",
      },
    ],
    pricingFields: [
      {
        id: "sqft",
        label: "Office square footage",
        type: "number",
        min: 500,
        max: 25000,
        step: 100,
        defaultValue: 2500,
      },
      {
        id: "restrooms",
        label: "Restrooms",
        type: "number",
        min: 1,
        max: 20,
        defaultValue: 2,
      },
      {
        id: "frequency",
        label: "Frequency",
        type: "select",
        defaultValue: "weekly",
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "biweekly", label: "Every 2 weeks" },
          { value: "monthly", label: "Monthly" },
        ],
      },
    ],
  },
  {
    slug: "deep-cleaning",
    title: "Deep Cleaning",
    shortTitle: "Deep clean",
    description:
      "A thorough top-to-bottom reset for homes that need extra attention — baseboards, inside appliances, and neglected corners.",
    metaDescription:
      "Professional deep cleaning in Central Florida. One-time intensive clean with transparent pricing. Book online.",
    heroImage:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80",
    heroAlt: "Professional cleaner carefully wiping a home surface during a deep clean",
    startingPrice: 229,
    priceUnit: "visit",
    includedItems: [
      "Everything in a standard home clean",
      "Inside microwave and reachable appliance fronts",
      "Baseboards and door frames throughout",
      "Light fixture and ceiling fan dusting",
      "Extra bathroom scrub and grout attention",
    ],
    faq: [
      {
        question: "How is deep cleaning different from weekly service?",
        answer:
          "Deep cleaning is a one-time intensive reset. Most customers follow with weekly maintenance to keep the standard up.",
      },
      {
        question: "How long does a deep clean take?",
        answer:
          "Typically 4–8 hours depending on size. We confirm timing when we review your booking.",
      },
    ],
    pricingFields: [
      {
        id: "bedrooms",
        label: "Bedrooms",
        type: "number",
        min: 1,
        max: 8,
        defaultValue: 3,
      },
      {
        id: "bathrooms",
        label: "Bathrooms",
        type: "number",
        min: 1,
        max: 6,
        defaultValue: 2,
      },
      {
        id: "sqft",
        label: "Square footage",
        type: "number",
        min: 500,
        max: 8000,
        step: 100,
        defaultValue: 1800,
      },
    ],
  },
  {
    slug: "move-in-out",
    title: "Move-In / Move-Out Cleaning",
    shortTitle: "Move in/out",
    description:
      "Empty-home cleaning for landlords, renters, and sellers who need a spotless handoff before keys change hands.",
    metaDescription:
      "Move-in and move-out cleaning across Central Florida. Empty-home deep clean with instant online booking.",
    heroImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    heroAlt: "Clean empty home with bright natural light ready for move-in",
    startingPrice: 249,
    priceUnit: "project",
    includedItems: [
      "Full kitchen and appliance cleaning",
      "All bathrooms scrubbed and sanitized",
      "Inside cabinets and closets wiped",
      "Floors vacuumed and mopped throughout",
      "Window sills and interior glass cleaned",
    ],
    faq: [
      {
        question: "Should the home be completely empty?",
        answer:
          "Ideally yes. We can work around large furniture if needed — note that in your booking details.",
      },
      {
        question: "Do you offer landlord move-out guarantees?",
        answer:
          "We document completion and can return for touch-ups if your property manager flags specific items within 48 hours.",
      },
    ],
    pricingFields: [
      {
        id: "bedrooms",
        label: "Bedrooms",
        type: "number",
        min: 1,
        max: 8,
        defaultValue: 3,
      },
      {
        id: "bathrooms",
        label: "Bathrooms",
        type: "number",
        min: 1,
        max: 6,
        defaultValue: 2,
      },
      {
        id: "sqft",
        label: "Square footage",
        type: "number",
        min: 500,
        max: 8000,
        step: 100,
        defaultValue: 1800,
      },
    ],
  },
  {
    slug: "post-construction",
    title: "Post-Construction Cleaning",
    shortTitle: "Post-construction",
    description:
      "Dust, debris, and fine-particle cleanup after renovations, new builds, and contractor finish work.",
    metaDescription:
      "Post-construction cleaning in Central Florida. Dust and debris removal with instant pricing. Book online.",
    heroImage:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1400&q=80",
    heroAlt: "Construction site interior ready for final cleaning pass",
    startingPrice: 299,
    priceUnit: "project",
    includedItems: [
      "Fine dust removal from surfaces and fixtures",
      "Window and track cleaning",
      "Floor vacuum and mop with HEPA equipment",
      "Cabinet interior and exterior wipe-down",
      "Debris bagging and disposal coordination",
    ],
    faq: [
      {
        question: "When should post-construction cleaning happen?",
        answer:
          "After all trades are finished and before final inspection or move-in. We can do a rough pass mid-project if needed.",
      },
      {
        question: "Do you handle hazardous materials?",
        answer:
          "We remove construction dust and debris only — not asbestos, mold remediation, or chemical waste.",
      },
    ],
    pricingFields: [
      {
        id: "sqft",
        label: "Square footage",
        type: "number",
        min: 500,
        max: 20000,
        step: 100,
        defaultValue: 2200,
      },
      {
        id: "debris",
        label: "Debris level",
        type: "select",
        defaultValue: "medium",
        options: [
          { value: "light", label: "Light dust only" },
          { value: "medium", label: "Moderate dust and scraps" },
          { value: "heavy", label: "Heavy debris throughout" },
        ],
      },
    ],
  },
  {
    slug: "airbnb-turnover",
    title: "Airbnb Turnover Cleaning",
    shortTitle: "Airbnb",
    description:
      "Fast, reliable turnover cleans between guests — linens, restock, and photo-ready staging for short-term rentals.",
    metaDescription:
      "Airbnb turnover cleaning in Central Florida. Guest-ready cleans with instant pricing. Book your turnover online.",
    heroImage:
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1400&q=80",
    heroAlt: "Guest-ready short-term rental bedroom styled for check-in",
    startingPrice: 119,
    priceUnit: "visit",
    includedItems: [
      "Full clean between guest stays",
      "Bed linen change and bed making",
      "Bathroom restock and sanitizing",
      "Kitchen reset and dish check",
      "Damage report with photos on request",
    ],
    faq: [
      {
        question: "Can you align with checkout/check-in times?",
        answer:
          "Yes. Share your turnover window when booking. We prioritize same-day turnovers when scheduled in advance.",
      },
      {
        question: "Do you restock supplies?",
        answer:
          "We can use owner-provided supplies or restock from an agreed list — note your preferences in booking details.",
      },
    ],
    pricingFields: [
      {
        id: "bedrooms",
        label: "Bedrooms",
        type: "number",
        min: 0,
        max: 8,
        defaultValue: 2,
      },
      {
        id: "bathrooms",
        label: "Bathrooms",
        type: "number",
        min: 1,
        max: 6,
        defaultValue: 1,
      },
      {
        id: "turnovers",
        label: "Turnovers per month",
        type: "number",
        min: 1,
        max: 30,
        defaultValue: 8,
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return services.find((service) => service.slug === slug);
}

export function isValidServiceSlug(slug: string): boolean {
  return services.some((service) => service.slug === slug);
}
