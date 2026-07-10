import { z } from "zod";
import { isValidServiceSlug } from "../data/services";
import type { TimeWindow } from "../config/pricing";

const pricingDetailsSchema = z.record(z.union([z.string(), z.number()]));

export const bookingPayloadSchema = z.object({
  serviceSlug: z.string().refine(isValidServiceSlug, "Invalid service"),
  pricingDetails: pricingDetailsSchema,
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  timeWindow: z.enum(["morning", "afternoon", "flexible"]),
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email required"),
  phone: z.string().trim().min(7, "Phone is required"),
  streetAddress: z.string().trim().min(5, "Street address is required"),
  city: z.string().trim().min(2, "City is required"),
  notes: z.string().trim().optional().default(""),
});

export type BookingPayload = z.infer<typeof bookingPayloadSchema>;

export interface StoredBooking extends BookingPayload {
  id: string;
  createdAt: string;
  estimatedPrice: number;
  priceUnit: "week" | "visit" | "project";
  serviceTitle: string;
  lineItems: { label: string; amount: number }[];
  emailsSent: boolean;
}

export function formatTimeWindow(window: TimeWindow): string {
  switch (window) {
    case "morning":
      return "Morning (8am – 12pm)";
    case "afternoon":
      return "Afternoon (12pm – 5pm)";
    case "flexible":
      return "Flexible — we will confirm";
  }
}
