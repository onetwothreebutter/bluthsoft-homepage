// The production origin, written once and shared by astro.config.mjs and the
// browser tests. Set PUBLIC_SITE_URL to override it (for a custom domain); an
// empty value counts as unset.
export const siteUrl =
  process.env.PUBLIC_SITE_URL || "https://bluthsoft-homepage.vercel.app";
