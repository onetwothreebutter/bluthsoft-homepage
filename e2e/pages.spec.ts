import { expect, test } from "@playwright/test";
import { home } from "../src/content/home";
import { header } from "../src/content/navigation";
import { notFound, privacy } from "../src/content/pages";

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the menu opens, closes with Escape, and closes when a link is chosen", async ({
    page,
  }) => {
    await page.goto("/");
    const menu = page.locator("#site-menu");

    await page.getByRole("button", { name: header.openMenu }).click();
    await expect(menu).toBeVisible();
    await expect(
      page.getByRole("button", { name: header.closeMenu }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    await page.getByRole("button", { name: header.openMenu }).click();
    await menu.getByRole("link", { name: "Product" }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/\/#product$/);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the hero form signs up and lands on /thanks", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator('form[data-lead-form="hero"]');
    await hero.getByLabel(home.hero.form.label).fill("gob@bluth.com");
    await hero.getByRole("button", { name: home.hero.form.submit }).click();
    await expect(page).toHaveURL(/\/thanks$/);
  });
});

test("a page that isn't built yet answers 404 with a way to start", async ({
  page,
}) => {
  const response = await page.goto("/pricing");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    notFound.heading,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
  await expect(
    page.getByRole("main").getByRole("link", { name: notFound.primary.label }),
  ).toHaveAttribute("href", notFound.primary.href);
});

test("the privacy page is published and indexable", async ({ page }) => {
  const response = await page.goto("/privacy");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    privacy.heading,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test("the product tabs switch panels by click and by keyboard", async ({
  page,
}) => {
  await page.goto("/#product");
  const [inventory, sales, ai] = home.product.panels;
  const tab = (name: string) => page.getByRole("tab", { name });
  const panel = (name: string) => page.getByRole("tabpanel", { name });

  await expect(panel(inventory.tab)).toBeVisible();
  await tab(sales.tab).click();
  await expect(panel(sales.tab)).toBeVisible();
  await expect(panel(inventory.tab)).toBeHidden();

  await page.keyboard.press("ArrowRight");
  await expect(tab(ai.tab)).toBeFocused();
  await expect(panel(ai.tab)).toBeVisible();
});
