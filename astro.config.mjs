// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

// Canonical origin. Previews deliberately keep pointing here, so search
// engines only ever see the production URL.
const site = process.env.PUBLIC_SITE_URL ?? "https://bluthsoft.vercel.app";

export default defineConfig({
  site,
  // Pages are prerendered by default; a route opts into running on demand
  // with `export const prerender = false` (the lead endpoint does).
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
