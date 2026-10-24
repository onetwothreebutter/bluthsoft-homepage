import { expect, test } from "@playwright/test";

// Runs with no HubSpot or PostHog configuration, so the endpoint is in stub
// mode. The handler's own logic is covered by unit tests; this checks the
// route is wired up and runs on demand rather than being prerendered.

test("the lead endpoint accepts a signup in stub mode", async ({ request }) => {
  const response = await request.post("/api/lead", {
    data: { email: "gob@bluth.com", intent: "signup", source: "hero" },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true, stub: true });
});

test("the lead endpoint rejects an invalid email with a field message", async ({
  request,
}) => {
  const response = await request.post("/api/lead", {
    data: { email: "gob", intent: "signup", source: "hero" },
  });
  expect(response.status()).toBe(422);
  expect((await response.json()).errors.email).toBeTruthy();
});

test("a form posted without JavaScript lands on /thanks", async ({ page }) => {
  // Load a page from the site first: Astro rejects form posts from another
  // origin (CSRF protection), and setContent keeps the current URL.
  await page.goto("/");
  await page.setContent(`
    <form method="post" action="/api/lead">
      <input name="email" value="lucille@bluth.com">
      <input name="intent" value="demo">
      <input name="source" value="demo">
      <input name="name" value="Lucille">
      <input name="website" value="">
      <button>Send</button>
    </form>`);
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page).toHaveURL(/\/thanks$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
