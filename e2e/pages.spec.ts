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

  test("the hero card's animation waits until the card is in view", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page.getByRole("img", { name: home.hero.dashboard.summary });
    const playStates = () =>
      card.evaluate((element) => [
        ...new Set(
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.playState),
        ),
      ]);

    await expect(card).toHaveAttribute("data-motion", "waiting");
    expect(await playStates()).toEqual(["paused"]);

    await card.scrollIntoViewIfNeeded();
    await expect(card).not.toHaveAttribute("data-motion");
    expect(await playStates()).not.toContain("paused");
  });
});

test("the hero card's animation starts at load on desktop", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: home.hero.dashboard.summary }),
  ).not.toHaveAttribute("data-motion");
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

  test("the hero card's animation plays on load", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("img", { name: home.hero.dashboard.summary }),
    ).not.toHaveAttribute("data-motion");
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

  // Nothing inside a panel can take focus, so the panel itself is the next
  // stop: Tab lands there, not on the next section.
  await page.keyboard.press("Tab");
  await expect(panel(ai.tab)).toBeFocused();
});

test("every in-page link on the homepage has somewhere to land", async ({
  page,
}) => {
  await page.goto("/");
  const targets = await page
    .locator('a[href^="/#"]')
    .evaluateAll((links) => [
      ...new Set(links.map((link) => link.getAttribute("href")!.slice(2))),
    ]);
  expect(targets.length).toBeGreaterThan(0);
  for (const id of targets) await expect(page.locator(`#${id}`)).toHaveCount(1);
});

test("focus rings are cream on the dark sections and ink elsewhere", async ({
  page,
}) => {
  await page.goto("/");
  // toHaveCSS retries: a link with `transition` fades its outline colour in.
  const expectRing = async (
    link: import("@playwright/test").Locator,
    color: string,
  ) => {
    await link.focus();
    expect(await link.evaluate((el) => el.matches(":focus-visible"))).toBe(
      true,
    );
    await expect(link).toHaveCSS("outline-color", color);
  };
  const cream = "rgb(251, 247, 238)";
  const ink = "rgb(22, 21, 15)";

  await expectRing(
    page
      .locator("#automation")
      .getByRole("link", { name: home.automation.cta.label }),
    cream,
  );
  await expectRing(page.locator("footer a").first(), cream);
  await expectRing(
    page.getByRole("link", { name: home.hero.secondary.label }),
    ink,
  );
});
