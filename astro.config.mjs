// @ts-check
import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { siteUrl } from "./site-url.mjs";

export default defineConfig({
  // Canonical origin. Previews deliberately keep pointing here, so search
  // engines only ever see the production URL.
  site: siteUrl,
  // Pages are prerendered by default; a route opts into running on demand
  // with `export const prerender = false` (the lead endpoint does).
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/thanks/"),
    }),
  ],
  // Every variable is optional: without them analytics is off and the lead
  // endpoint runs as a labelled stub, so a fresh clone works with no setup.
  env: {
    schema: {
      PUBLIC_POSTHOG_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_POSTHOG_HOST: envField.string({
        context: "client",
        access: "public",
        default: "https://us.i.posthog.com",
      }),
      // Which Vercel deployment this is, from Vercel's own VERCEL_ENV at build
      // time. Events carry it so QA traffic on previews can be filtered out.
      PUBLIC_VERCEL_ENV: envField.string({
        context: "client",
        access: "public",
        default: process.env.VERCEL_ENV ?? "development",
      }),
      HUBSPOT_PORTAL_ID: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      HUBSPOT_FORM_GUID: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
