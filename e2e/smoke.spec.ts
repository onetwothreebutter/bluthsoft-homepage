import { expect, test } from "@playwright/test";
import { home } from "../src/content/home";

test("homepage loads with its heading", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    home.hero.heading,
  );
});

test("homepage carries the tags search engines read", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(home.meta.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    home.meta.description,
  );
  // Canonical is absolute and points at production, whatever host served the page.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://bluthsoft-homepage.vercel.app/",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      "[]",
  );
  expect(jsonLd.map((entry: { "@type": string }) => entry["@type"])).toEqual([
    "Organization",
    "SoftwareApplication",
  ]);
  expect(JSON.stringify(jsonLd)).not.toContain("aggregateRating");
});

test("robots.txt points at the sitemap", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain(
    "Sitemap: https://bluthsoft-homepage.vercel.app/sitemap-index.xml",
  );
});
