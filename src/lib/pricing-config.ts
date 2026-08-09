/**
 * Server-side fetch of this site's prices from Booking Broom.
 *
 * Never import this from browser code: it reads the API key. The wizard gets the
 * same config through the `/api/pricing-config` proxy instead. Any failure falls
 * back to the prices compiled into the build, because a stale price is far
 * better than a missing or wrong one.
 */
import {
  DEFAULT_PRICING_CONFIG,
  isUsablePricingConfig,
  type PricingConfig,
} from "../config/pricing";

export interface PricingConfigResult {
  config: PricingConfig;
  /** False when the compiled fallback is being served. */
  live: boolean;
  version?: number;
}

/** Seconds the browser and any CDN in front of it may reuse a config. */
export const PRICING_CACHE_SECONDS = 300;

function env(name: string, runtimeEnv?: Record<string, unknown>): string | undefined {
  if (runtimeEnv && typeof runtimeEnv[name] === "string") {
    return runtimeEnv[name] as string;
  }
  const fromImport = (import.meta.env as Record<string, string | undefined> | undefined)?.[
    name
  ];
  if (fromImport) return fromImport;
  if (typeof process !== "undefined") {
    return process.env[name];
  }
  return undefined;
}

export async function getPricingConfig(
  runtimeEnv?: Record<string, unknown>,
): Promise<PricingConfigResult> {
  const baseUrl = env("BOOKING_BROOM_URL", runtimeEnv)?.replace(/\/$/, "");
  const apiKey = env("BOOKING_BROOM_API_KEY", runtimeEnv);
  if (!baseUrl || !apiKey) {
    return { config: DEFAULT_PRICING_CONFIG, live: false };
  }

  try {
    const response = await fetch(`${baseUrl}/api/pricing`, {
      headers: {
        "X-Site-Slug": env("BOOKING_BROOM_SITE_SLUG", runtimeEnv) || "cleaning-weekly",
        "X-Api-Key": apiKey,
      },
    });

    if (!response.ok) {
      console.error("[pricing-config] fetch failed:", `HTTP ${response.status}`);
      return { config: DEFAULT_PRICING_CONFIG, live: false };
    }

    const body = (await response.json()) as { config?: unknown; version?: number };
    if (!isUsablePricingConfig(body.config)) {
      console.error("[pricing-config] unrecognised config shape — using defaults");
      return { config: DEFAULT_PRICING_CONFIG, live: false };
    }

    return { config: body.config, live: true, version: body.version };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[pricing-config] fetch error:", message);
    return { config: DEFAULT_PRICING_CONFIG, live: false };
  }
}
