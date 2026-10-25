import { expect, test } from "@playwright/test";
import { home } from "../src/content/home";
import { demo } from "../src/content/pages";

// The lead endpoint runs as a stub here (no HubSpot configuration), so these
// exercise the real forms and route without creating contacts.

const { getStarted } = home;
const { stands, sells, email } = getStarted.steps;
const setup = (page: import("@playwright/test").Page) =>
  page.locator('form[data-lead-form="setup"]');

test("the setup questions sign someone up, one question at a time", async ({
  page,
}) => {
  await page.goto("/#get-started");
  const form = setup(page);

  await expect(form.getByText("STEP 1 OF 3")).toBeVisible();
  await form.getByText(stands.options[1].label).click();
  await form.getByRole("button", { name: getStarted.next }).click();

  await expect(form.getByText(sells.question)).toBeVisible();
  await form.getByText(sells.options[0].label).click();
  await form.getByRole("button", { name: getStarted.next }).click();

  await form.getByLabel(email.question).fill("gob@bluth.com");
  await form.getByRole("button", { name: getStarted.submit }).click();

  await expect(form.getByText(getStarted.success.heading)).toBeVisible();
});

test("a hero signup carries its email into the setup questions", async ({
  page,
}) => {
  await page.goto("/");
  const hero = page.locator('form[data-lead-form="hero"]');
  await hero.getByLabel(home.hero.form.label).fill("gob@bluth.com");
  await hero.getByRole("button", { name: home.hero.form.submit }).click();

  await expect(page.getByRole("status")).toHaveText(getStarted.heroSuccess);
  const form = setup(page);
  await expect(form.getByText("STEP 1 OF 2")).toBeVisible();

  await form.getByText(stands.options[0].label).click();
  await form.getByRole("button", { name: getStarted.next }).click();
  await form.getByRole("button", { name: getStarted.submit }).click();

  await expect(form.getByText(getStarted.success.heading)).toBeVisible();
});

test("more than 20 stands goes to /demo with the answer filled in", async ({
  page,
}) => {
  await page.goto("/#get-started");
  const form = setup(page);
  await form.getByText(stands.options[3].label).click();
  await form.getByRole("button", { name: getStarted.toDemo }).click();

  // The carried answer is read, then removed from the address bar.
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByLabel(demo.form.stands)).toHaveValue("20+");
});

test("Book a demo carries the visit's campaign and referrer, and the link stays plain", async ({
  page,
  context,
}) => {
  // Another site's own `ref` tag, which isn't a hand-off, plus its real referrer.
  await page.goto("/?ref=producthunt&utm_source=ph", {
    referer: "https://www.producthunt.com/",
  });
  const link = page.getByRole("link", { name: home.finalCta.secondary.label });
  const demoRequest = () =>
    context.waitForEvent(
      "request",
      (request) => new URL(request.url()).pathname === "/demo",
    );
  const expectCarried = (url: string) => {
    const params = new URL(url).searchParams;
    expect(params.get("utm_source")).toBe("ph");
    expect(params.get("bs_ref")).toBe("https://www.producthunt.com/");
  };

  // A middle-click opens a tab and this page stays open, so the link has to
  // go back to its plain href once the tab has the hand-off.
  const tab = demoRequest();
  await link.click({ button: "middle" });
  expectCarried((await tab).url());
  await expect(link).toHaveAttribute("href", "/demo");

  const followed = demoRequest();
  await link.click();
  expectCarried((await followed).url());
  await expect(page).toHaveURL(/\/demo$/);
});

test("the demo form books a demo", async ({ page }) => {
  await page.goto("/demo");
  await page.getByLabel(demo.form.name).fill("Lucille Bluth");
  await page.getByLabel(demo.form.email).fill("lucille@bluth.com");
  await page.getByRole("button", { name: demo.form.submit }).click();
  await expect(page.getByText(demo.success.heading)).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the setup questions are one form that posts", async ({ page }) => {
    await page.goto("/#get-started");
    const form = setup(page);
    await form.getByText(stands.options[1].label).click();
    await form.getByLabel(email.question).fill("gob@bluth.com");
    await form.getByRole("button", { name: getStarted.submit }).click();
    await expect(page).toHaveURL(/\/thanks$/);
  });
});
