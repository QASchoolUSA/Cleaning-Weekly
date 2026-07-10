import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.cleaningweekly.com",
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/book/confirmation"),
    }),
  ],
});
