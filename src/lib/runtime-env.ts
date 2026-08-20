/**
 * Worker bindings (wrangler.jsonc vars + `wrangler secret put`).
 *
 * Do not read `locals.runtime.env` — Astro 7 throws. Secrets live on
 * `cloudflare:workers` `env`; wrangler vars may also appear on process.env.
 */
export async function getRuntimeEnv(
  _locals?: unknown,
): Promise<Record<string, unknown> | undefined> {
  const merged: Record<string, unknown> = {};

  if (typeof process !== "undefined" && process.env) {
    for (const [key, value] of Object.entries(process.env)) {
      if (typeof value === "string" && value.trim()) merged[key] = value;
    }
  }

  try {
    const { env } = await import("cloudflare:workers");
    if (env && typeof env === "object") {
      Object.assign(merged, env);
    }
  } catch (error) {
    console.error("[runtime-env] cloudflare:workers unavailable", error);
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}
