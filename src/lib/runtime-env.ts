/**
 * The Worker's secrets (`.dev.vars` locally, `wrangler secret put` in
 * production). Astro v6 removed `Astro.locals.runtime.env`, and reading it now
 * throws, so every caller goes through here instead.
 *
 * Imported dynamically because `cloudflare:workers` only resolves inside the
 * Workers runtime; anywhere else the callers fall back to `import.meta.env`.
 */
export async function getRuntimeEnv(): Promise<
  Record<string, unknown> | undefined
> {
  try {
    const { env } = await import("cloudflare:workers");
    return env as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
