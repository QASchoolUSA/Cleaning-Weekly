import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://www.cleaningweekly.com",
  output: "static",
  adapter: cloudflare(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/book/confirmation"),
    }),
  ],
});