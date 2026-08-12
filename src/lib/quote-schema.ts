import { z } from "zod";

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email required"),
  phone: z.string().trim().optional(),
  service: z.enum(["home", "office", "both"]),
  city: z.string().trim().min(2, "City is required"),
  message: z.string().trim().optional(),
});

export type QuoteRequestPayload = z.infer<typeof quoteRequestSchema>;

const SERVICE_LABELS: Record<QuoteRequestPayload["service"], string> = {
  home: "Home cleaning",
  office: "Office cleaning",
  both: "Home & office cleaning",
};

export function quoteServiceLabel(service: QuoteRequestPayload["service"]): string {
  return SERVICE_LABELS[service];
}
