import { describe, expect, it, vi } from "vitest";
import {
  createAnalytics,
  readAttribution,
  type PostHogClient,
} from "./analytics";

const landing =
  "https://bluthsoft-homepage.vercel.app/?utm_source=newsletter&utm_medium=email&utm_campaign=frozen-week&utm_term=&ref=x";

function fakePostHog() {
  return {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    get_distinct_id: vi.fn(() => "anon-123"),
  } satisfies PostHogClient;
}

describe("readAttribution", () => {
  it("keeps the UTM tags that have values and ignores other parameters", () => {
    expect(readAttribution(landing)).toEqual({
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "frozen-week",
    });
  });

  it("records an external referrer but not one from this site", () => {
    expect(
      readAttribution(
        "https://bluthsoft-homepage.vercel.app/",
        "https://news.ycombinator.com/item?id=1",
      ),
    ).toEqual({ referrer: "https://news.ycombinator.com/item?id=1" });
    expect(
      readAttribution(
        "https://bluthsoft-homepage.vercel.app/",
        "https://bluthsoft-homepage.vercel.app/privacy",
      ),
    ).toEqual({});
  });

  it("ignores a referrer that isn't a URL", () => {
    expect(
      readAttribution("https://bluthsoft-homepage.vercel.app/", "not a url"),
    ).toEqual({});
  });
});

describe("createAnalytics without a key", () => {
  it("never loads the provider and turns every call into a no-op", () => {
    const load = vi.fn();
    const analytics = createAnalytics({ url: landing, load });

    analytics.page();
    analytics.track("CTA Clicked", { location: "hero" });
    analytics.identify("someone");

    expect(load).not.toHaveBeenCalled();
    expect(analytics.anonymousId()).toBeNull();
  });

  it("still reports attribution, so forms can submit it", () => {
    const analytics = createAnalytics({ url: landing });
    expect(analytics.attribution()).toMatchObject({ utm_source: "newsletter" });
  });
});

describe("createAnalytics with a key", () => {
  it("initialises PostHog without cookies and with inputs masked in replays", async () => {
    const posthog = fakePostHog();
    createAnalytics({
      key: "phc_test",
      host: "https://ph.example",
      url: landing,
      load: async () => posthog,
    });
    await vi.waitFor(() => expect(posthog.init).toHaveBeenCalled());

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "https://ph.example",
        persistence: "memory",
        capture_pageview: false,
        autocapture: false,
        session_recording: { maskAllInputs: true },
      }),
    );
  });

  it("replays calls made before PostHog loaded, in order, with UTM tags attached", async () => {
    const posthog = fakePostHog();
    const analytics = createAnalytics({
      key: "phc_test",
      url: landing,
      load: async () => posthog,
    });

    analytics.page();
    analytics.track("CTA Clicked", { location: "hero" });
    expect(posthog.capture).not.toHaveBeenCalled();

    await vi.waitFor(() => expect(posthog.capture).toHaveBeenCalledTimes(2));
    expect(posthog.capture.mock.calls).toEqual([
      [
        "$pageview",
        {
          utm_source: "newsletter",
          utm_medium: "email",
          utm_campaign: "frozen-week",
        },
      ],
      [
        "CTA Clicked",
        {
          utm_source: "newsletter",
          utm_medium: "email",
          utm_campaign: "frozen-week",
          location: "hero",
        },
      ],
    ]);
    expect(analytics.anonymousId()).toBe("anon-123");
  });

  it("keeps the page working when PostHog can't load", async () => {
    const analytics = createAnalytics({
      key: "phc_test",
      url: landing,
      load: () => Promise.reject(new Error("blocked")),
    });
    analytics.track("CTA Clicked");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(analytics.anonymousId()).toBeNull();
  });
});
