/**
 * GO_LIVE: With `output: "static"` in astro.config, Astro middleware may not
 * run for purely static assets. Keep this file so Cloudflare/SSR adapter paths
 * can enforce HTTPS + apex host when the runtime executes middleware. Prefer
 * also configuring Host/HTTPS redirects at the CDN (Cloudflare Rules) for
 * static deploys.
 */
import { defineMiddleware } from "astro:middleware";

const APEX_HOST = "cleaningweekly.com";

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  const forwardedProto = context.request.headers.get("x-forwarded-proto");
  const hostHeader = (context.request.headers.get("host") ?? url.hostname)
    .split(":")[0]
    .replace(/\.$/, "")
    .toLowerCase();

  const isHttp =
    url.protocol === "http:" || forwardedProto?.split(",")[0]?.trim() === "http";
  const isWww = hostHeader === `www.${APEX_HOST}`;

  if (!isHttp && !isWww) {
    return next();
  }

  const target = new URL(url.toString());
  target.protocol = "https:";
  target.hostname = APEX_HOST;
  target.port = "";

  return context.redirect(target.toString(), 301);
});
