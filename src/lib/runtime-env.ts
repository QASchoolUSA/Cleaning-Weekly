/**
 * Worker bindings (wrangler.jsonc vars + `wrangler secret put`).
 *
 * Prefer `locals` from the Astro API context. Dynamic `cloudflare:workers`
 * import is a fallback — it often fails in the bundled Worker, which left
 * BOOKING_BROOM_API_KEY unset and silently skipped the Booking Broom forward.
 */
export async function getRuntimeEnv(
  locals?: unknown,
): Promise<Record<string, unknown> | undefined> {
  const fromLocals = envFromLocals(locals);
  if (fromLocals) return fromLocals;

  try {
    const { env } = await import("cloudflare:workers");
    return env as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function envFromLocals(locals: unknown): Record<string, unknown> | undefined {
  if (!locals || typeof locals !== "object") return undefined;
  const bag = locals as {
    runtime?: { env?: Record<string, unknown> };
    cloudflare?: { env?: Record<string, unknown> };
  };
  if (bag.runtime?.env && typeof bag.runtime.env === "object") {
    return bag.runtime.env;
  }
  if (bag.cloudflare?.env && typeof bag.cloudflare.env === "object") {
    return bag.cloudflare.env;
  }
  return undefined;
}
