import { defineConfig, devices } from "@playwright/test";

const port = 4321;

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
    reuseExistingServer: !process.env.CI,
  },
});
