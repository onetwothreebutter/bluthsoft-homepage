import { defineConfig, devices } from "@playwright/test";

// Not 4321, so a `pnpm dev` already running there is never mistaken for the
// test server.
const port = 4329;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // The Vercel adapter doesn't support `astro preview`, so tests run against
  // the dev server, which serves both static pages and on-demand routes.
  // `--ignore-lock` keeps it in the foreground: Astro backgrounds `astro dev`
  // when it detects a coding agent, and Playwright would see it exit.
  webServer: {
    command: `pnpm astro dev --port ${port} --ignore-lock`,
    url: `http://localhost:${port}`,
    // Always a fresh server with the variables below, never one started
    // with someone's .env.
    reuseExistingServer: false,
    // Blank the service keys so a local .env can't apply: the forms run
    // against the stub, and no test creates a real contact or event.
    // (Variables already in the environment take priority over .env files.)
    env: {
      HUBSPOT_PORTAL_ID: "",
      HUBSPOT_FORM_GUID: "",
      PUBLIC_POSTHOG_KEY: "",
    },
  },
});
