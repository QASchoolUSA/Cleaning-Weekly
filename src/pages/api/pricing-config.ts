export const prerender = false;

import type { APIRoute } from "astro";
import {
  PRICING_CACHE_SECONDS,
  getPricingConfig,
} from "../../lib/pricing-config";
import { getRuntimeEnv } from "../../lib/runtime-env";

/**
 * The booking wizard is a static page, so it cannot read the Booking Broom key.
 * This endpoint is the one dynamic hop: it fetches the live config server-side
 * and hands the wizard the numbers only.
 */
export const GET: APIRoute = async ({ locals }) => {
  const runtimeEnv = await getRuntimeEnv(locals);
  const { config, live, version } = await getPricingConfig(runtimeEnv);

  return new Response(JSON.stringify({ config, live, version }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${PRICING_CACHE_SECONDS}, stale-while-revalidate=${PRICING_CACHE_SECONDS * 2}`,
    },
  });
};
