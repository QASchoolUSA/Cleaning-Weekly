/**
 * @astrojs/sitemap with trailingSlash:"never" / build.format:"file" rewrites
 * `<loc>https://cleaningweekly.com/</loc>` → bare origin (no path). Restore
 * the WHATWG-serialized homepage URL so sitemap locs stay consistent.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sitemapPath = resolve("dist/client/sitemap.xml");
const xml = readFileSync(sitemapPath, "utf8");
const next = xml.replaceAll(
  "<loc>https://cleaningweekly.com</loc>",
  "<loc>https://cleaningweekly.com/</loc>",
);
if (next === xml) {
  console.warn(
    "[normalize-sitemap-homepage] No bare homepage <loc> found; sitemap may already be correct.",
  );
}
writeFileSync(sitemapPath, next);
