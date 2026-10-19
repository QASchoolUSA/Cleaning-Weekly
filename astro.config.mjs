import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

/**
 * Prefer non-trailing-slash URLs to match BaseLayout canonicals.
 * Default directory build + Cloudflare auto-trailing-slash served /about/
 * while canonicals pointed at /about — GSC "Alternate page with proper canonical tag".
 */
export default defineConfig({
  site: "https://cleaningweekly.com",
  output: "static",
  trailingSlash: "never",
  build: {
    // Emit about.html (not about/index.html) so hosts don't prefer /about/.
    format: "file",
  },
  adapter: cloudflare(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/book/confirmation"),
      // Align <loc> with BaseLayout: homepage is origin+"/"; others have no slash.
      // @astrojs/sitemap + trailingSlash:"never" can emit a bare origin for "/".
      serialize(item) {
        if (
          item.url === "https://cleaningweekly.com" ||
          item.url === "https://cleaningweekly.com/"
        ) {
          item.url = "https://cleaningweekly.com/";
          return item;
        }
        if (item.url.endsWith("/")) {
          item.url = item.url.slice(0, -1);
        }
        return item;
      },
    }),
  ],
});
