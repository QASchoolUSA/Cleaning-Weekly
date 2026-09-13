export const prerender = false;

import type { APIRoute } from "astro";
import { getRuntimeEnv } from "../../lib/runtime-env";

function env(name: string, runtimeEnv?: Record<string, unknown>): string | undefined {
  if (runtimeEnv && typeof runtimeEnv[name] === "string") {
    const value = (runtimeEnv[name] as string).trim();
    return value || undefined;
  }
  const fromImport = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromImport?.trim()) return fromImport.trim();
  if (typeof process !== "undefined") {
    return process.env[name]?.trim() || undefined;
  }
  return undefined;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const form = (await request.json()) as Record<string, unknown>;
    const runtimeEnv = await getRuntimeEnv(locals);

    const sessionKey =
      typeof form.session_key === "string" && form.session_key.trim()
        ? form.session_key.trim()
        : "";
    if (!sessionKey) {
      return new Response(JSON.stringify({ error: "session_key is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = typeof form.email === "string" ? form.email : undefined;
    const phone = typeof form.phone === "string" ? form.phone : undefined;
    const hasEmail =
      !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const hasPhone = !!phone && phone.replace(/\D/g, "").length >= 10;
    if (!hasEmail && !hasPhone) {
      return new Response(
        JSON.stringify({ error: "A valid email or phone is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const baseUrl = (
      env("BOOKING_BROOM_URL", runtimeEnv) || "https://app.bookingbroom.com"
    ).replace(/\/$/, "");
    const apiKey = env("BOOKING_BROOM_API_KEY", runtimeEnv);
    const siteSlug = "cleaning-weekly";

    if (!baseUrl || !apiKey) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const wirePayload = {
      site_slug: siteSlug,
      api_key: apiKey,
      session_key: sessionKey,
      customer_name:
        typeof form.customer_name === "string" ? form.customer_name : undefined,
      email,
      phone,
      address: typeof form.address === "string" ? form.address : undefined,
      service_type:
        typeof form.service_type === "string" ? form.service_type : undefined,
      preferred_date:
        typeof form.preferred_date === "string" ? form.preferred_date : undefined,
      preferred_time:
        typeof form.preferred_time === "string" ? form.preferred_time : undefined,
      notes: typeof form.notes === "string" ? form.notes : undefined,
      intent:
        form.intent === "quote" || form.intent === "book"
          ? form.intent
          : undefined,
      property: form.property,
      quote: form.quote,
      attribution: form.attribution,
      last_step:
        typeof form.last_step === "string"
          ? form.last_step
          : form.last_step != null
            ? String(form.last_step)
            : undefined,
    };

    const res = await fetch(`${baseUrl}/api/leads/partial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wirePayload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return new Response(
        JSON.stringify({
          error:
            typeof (data as { error?: string }).error === "string"
              ? (data as { error: string }).error
              : "Lead save failed",
        }),
        {
          status: res.status >= 400 && res.status < 600 ? res.status : 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
