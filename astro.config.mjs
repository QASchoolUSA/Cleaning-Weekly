import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://cleaningweekly.com",
  output: "static",
  adapter: cloudflare(),
  redirects: {
    // Many crawlers and tools only probe /sitemap.xml
    "/sitemap.xml": "/sitemap-index.xml",
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/book/confirmation"),
    }),
  ],
});