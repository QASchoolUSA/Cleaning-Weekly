import { services, type ServiceDefinition } from "../data/services";
import { calculatePrice, formatPrice, type PricingResult } from "./pricing";
import type { BookingPayload } from "./schemas";

export interface WizardState {
  step: number;
  serviceSlug: string;
  pricingDetails: Record<string, string | number>;
  estimate: PricingResult | null;
  preferredDate: string;
  timeWindow: BookingPayload["timeWindow"];
  name: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  notes: string;
}

const STEP_LABELS = [
  "What do you need cleaned?",
  "About your home",
  "When & how to reach you",
  "Looks good?",
];

export function getTomorrowDateString(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function getInitialState(serviceSlug?: string): WizardState {
  const fromUrl = Boolean(serviceSlug && services.some((s) => s.slug === serviceSlug));
  const slug = fromUrl ? serviceSlug! : services[0].slug;
  const service = services.find((s) => s.slug === slug)!;
  const pricingDetails = Object.fromEntries(
    service.pricingFields.map((field) => [field.id, field.defaultValue]),
  );

  return {
    step: fromUrl ? 2 : 1,
    serviceSlug: slug,
    pricingDetails,
    estimate: calculatePrice(slug, pricingDetails),
    preferredDate: getTomorrowDateString(),
    timeWindow: "flexible",
    name: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    notes: "",
  };
}

export function getServiceCatalog(): ServiceDefinition[] {
  return services;
}

export function getService(slug: string): ServiceDefinition | undefined {
  return services.find((s) => s.slug === slug);
}

export function updateEstimate(state: WizardState): WizardState {
  return {
    ...state,
    estimate: calculatePrice(state.serviceSlug, state.pricingDetails),
  };
}

export function validateStep(state: WizardState): Record<string, string> {
  const errors: Record<string, string> = {};

  if (state.step === 1 && !state.serviceSlug) {
    errors.serviceSlug = "Choose a service";
  }

  if (state.step === 2) {
    const service = getService(state.serviceSlug);
    service?.pricingFields.forEach((field) => {
      const value = state.pricingDetails[field.id];
      if (value === "" || value === undefined || value === null) {
        errors[field.id] = `${field.label} is required`;
      }
    });
  }

  if (state.step === 3) {
    if (!state.preferredDate) errors.preferredDate = "Choose a start date";
    if (!state.timeWindow) errors.timeWindow = "Choose a time window";
    if (state.name.trim().length < 2) errors.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
      errors.email = "Enter a valid email";
    }
    if (state.phone.trim().length < 7) errors.phone = "Enter your phone number";
    if (state.streetAddress.trim().length < 5) {
      errors.streetAddress = "Enter your street address";
    }
    if (state.city.trim().length < 2) errors.city = "Enter your city";
  }

  return errors;
}

export function formatEstimate(state: WizardState): string {
  if (!state.estimate) return "—";
  return formatPrice(state.estimate.total, state.estimate.unit);
}

export { STEP_LABELS, formatPrice };
