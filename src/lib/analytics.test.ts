import { describe, expect, it, vi } from "vitest";
import {
  createAnalytics,
  createReplayQueue,
  type PostHogClient,
} from "./analytics";

const landing =
  "https://bluthsoft-homepage.vercel.app/?utm_source=newsletter&utm_medium=email&utm_campaign=frozen-week&utm_term=&ref=x";

function fakePostHog() {
  return {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    register: vi.fn(),
    get_distinct_id: vi.fn(() => "anon-123"),
  } satisfies PostHogClient;
}

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

  it("tags every event with the deployment environment", async () => {
    const posthog = fakePostHog();
    createAnalytics({
      key: "phc_test",
      url: landing,
      environment: "preview",
      load: async () => posthog,
    });
    await vi.waitFor(() =>
      expect(posthog.register).toHaveBeenCalledWith({ environment: "preview" }),
    );
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

describe("createReplayQueue", () => {
  it("holds calls until the provider is ready, then replays them in order", () => {
    const calls = createReplayQueue<string[]>();
    calls.run((log) => log.push("first"));
    calls.run((log) => log.push("second"));
    expect(calls.pending).toBe(2);

    const log: string[] = [];
    calls.ready(log);
    calls.run((target) => target.push("after"));
    expect(log).toEqual(["first", "second", "after"]);
    expect(calls.pending).toBe(0);
  });

  it("stops holding calls once the provider has failed to load", () => {
    const calls = createReplayQueue<string[]>();
    calls.run((log) => log.push("before"));
    calls.fail();
    for (let i = 0; i < 50; i++) calls.run((log) => log.push("later"));
    expect(calls.pending).toBe(0);
  });
});
