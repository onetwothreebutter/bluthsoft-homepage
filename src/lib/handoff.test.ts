// @vitest-environment happy-dom
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { bindClickTracking, type Analytics } from "./analytics";
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

/** Lets the hand-off's restore timer run. */
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("handoffUrl", () => {
  it("adds the ID, campaign tags, referrer and answers", () => {
    const href = handoffUrl("/demo", fakeAnalytics(), { stands: "20+" });
    const params = new URL(href, "https://x.test").searchParams;
    expect(href.startsWith("/demo?")).toBe(true);
    expect(Object.fromEntries(params)).toEqual({
      bs_vid: id,
      utm_source: "newsletter",
      utm_campaign: "fall",
      bs_ref: "https://www.google.com/",
      bs_stands: "20+",
    });
  });

  it("leaves the ID out when analytics hasn't loaded", () => {
    expect(handoffUrl("/demo", fakeAnalytics(null))).not.toContain("bs_vid=");
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
      `https://bluthsoft.test/demo?bs_vid=${id}&lang=en#form`,
    );
    expect(cleanUrl).toBe("/demo?lang=en#form");
  });

  it("ignores an ID that isn't one", () => {
    expect(
      readHandoff("https://bluthsoft.test/demo?bs_vid=lucille").distinctId,
    ).toBeUndefined();
  });

  it("drops a carried referrer that isn't a URL, so the browser's is used", () => {
    const handoff = readHandoff(
      `https://bluthsoft.test/demo?bs_vid=${id}&bs_ref=producthunt`,
    );
    expect(handoff.referrer).toBeUndefined();
    expect(handoff.cleanUrl).toBe("/demo");
  });

  it("leaves another site's ref tag alone", () => {
    expect(
      readHandoff("https://bluthsoft.test/?ref=producthunt&utm_source=ph"),
    ).toEqual({ answers: {}, cleanUrl: null });
  });

  it("leaves a campaign link to /demo alone, ref tag and all", () => {
    const handoff = readHandoff(
      "https://bluthsoft.test/demo?utm_source=newsletter&ref=producthunt",
    );
    expect(handoff.cleanUrl).toBeNull();
    expect(handoff.referrer).toBeUndefined();
  });

  it("only reads a hand-off on /demo", () => {
    expect(readHandoff(`https://bluthsoft.test/?bs_vid=${id}`)).toEqual({
      answers: {},
      cleanUrl: null,
    });
  });
});

describe("bindHandoffLinks", () => {
  // Bound once, as the page does: listeners on `document` outlive a test, and
  // a second binding would rewrite the already-rewritten href.
  const analytics = fakeAnalytics();
  beforeAll(() => {
    bindClickTracking(document, analytics);
    bindHandoffLinks(document, analytics);
  });
  beforeEach(() => analytics.track.mockClear());

  function links(html: string) {
    document.body.innerHTML = html;
    const all = [...document.querySelectorAll("a")];
    for (const link of all)
      link.addEventListener("click", (event) => event.preventDefault());
    return all;
  }

  it("adds the hand-off to a /demo link when it's followed, then puts the plain href back", async () => {
    const [demo, pricing] = links(
      '<a href="/demo">Book a demo</a><a href="/pricing">Pricing</a>',
    );

    demo.click();
    pricing.click();
    expect(demo.getAttribute("href")).toContain(`bs_vid=${id}`);
    expect(pricing.getAttribute("href")).toBe("/pricing");

    await nextTask();
    expect(demo.getAttribute("href")).toBe("/demo");
  });

  it("tracks the plain destination on every click", async () => {
    const [demo] = links(
      '<a href="/demo" data-track="CTA Clicked" data-location="final-cta">Book a demo</a>',
    );

    demo.click();
    await nextTask();
    demo.click();
    await nextTask();

    expect(analytics.track).toHaveBeenCalledTimes(2);
    for (const [, properties] of analytics.track.mock.calls)
      expect(properties).toMatchObject({ destination: "/demo" });
  });

  it("carries the hand-off on a middle-click, not a right-click", () => {
    const [demo] = links('<a href="/demo">Book a demo</a>');
    const auxclick = (button: number) =>
      demo.dispatchEvent(new MouseEvent("auxclick", { button, bubbles: true }));

    auxclick(2);
    expect(demo.getAttribute("href")).toBe("/demo");
    auxclick(1);
    expect(demo.getAttribute("href")).toContain(`bs_vid=${id}`);
  });

  it("leaves a link to another site's /demo alone", () => {
    const [other] = links('<a href="https://example.com/demo">Their demo</a>');
    other.click();
    expect(other.getAttribute("href")).toBe("https://example.com/demo");
  });
});
