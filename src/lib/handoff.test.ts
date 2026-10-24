// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Analytics } from "./analytics";
import { bindHandoffLinks, handoffUrl, readHandoff } from "./handoff";

const id = "0192f3a4-5b6c-7d8e-9f01-23456789abcd";

function fakeAnalytics(anonymousId: string | null = id) {
  return {
    track: vi.fn(),
    page: vi.fn(),
    identify: vi.fn(),
    anonymousId: () => anonymousId,
    attribution: () => ({
      utm_source: "newsletter",
      utm_campaign: "fall",
      referrer: "https://www.google.com/",
    }),
  } satisfies Analytics;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("handoffUrl", () => {
  it("adds the ID, campaign tags, referrer and answers", () => {
    const href = handoffUrl("/demo", fakeAnalytics(), { stands: "20+" });
    const params = new URL(href, "https://x.test").searchParams;
    expect(href.startsWith("/demo?")).toBe(true);
    expect(Object.fromEntries(params)).toEqual({
      vid: id,
      utm_source: "newsletter",
      utm_campaign: "fall",
      ref: "https://www.google.com/",
      stands: "20+",
    });
  });

  it("leaves the ID out when analytics hasn't loaded", () => {
    expect(handoffUrl("/demo", fakeAnalytics(null))).not.toContain("vid=");
  });
});

describe("readHandoff", () => {
  it("reads what handoffUrl wrote and cleans the address", () => {
    const href = handoffUrl("/demo", fakeAnalytics(), { stands: "20+" });
    expect(readHandoff(`https://bluthsoft.test${href}`)).toEqual({
      distinctId: id,
      referrer: "https://www.google.com/",
      answers: { stands: "20+" },
      cleanUrl: "/demo",
    });
  });

  it("keeps parameters it didn't add", () => {
    const { cleanUrl } = readHandoff(
      `https://bluthsoft.test/demo?vid=${id}&lang=en#form`,
    );
    expect(cleanUrl).toBe("/demo?lang=en#form");
  });

  it("ignores an ID that isn't one", () => {
    expect(
      readHandoff("https://bluthsoft.test/demo?vid=lucille").distinctId,
    ).toBeUndefined();
  });

  it("leaves a plain campaign link to /demo alone", () => {
    const handoff = readHandoff(
      "https://bluthsoft.test/demo?utm_source=newsletter",
    );
    expect(handoff.cleanUrl).toBeNull();
  });
});

describe("bindHandoffLinks", () => {
  it("adds the hand-off to a /demo link when it's followed", () => {
    document.body.innerHTML =
      '<a href="/demo">Book a demo</a><a href="/pricing">Pricing</a>';
    bindHandoffLinks(document, fakeAnalytics());
    const [demo, pricing] = document.querySelectorAll("a");
    for (const link of [demo, pricing])
      link.addEventListener("click", (event) => event.preventDefault());

    demo.click();
    pricing.click();

    expect(demo.getAttribute("href")).toContain(`vid=${id}`);
    expect(pricing.getAttribute("href")).toBe("/pricing");
  });
});
