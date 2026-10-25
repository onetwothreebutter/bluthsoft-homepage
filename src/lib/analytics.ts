/**
 * The only module that talks to the analytics provider.
 *
 * The API is Segment's (`track`, `page`, `identify`, `anonymousId`), so moving
 * to Segment, or adding a second destination, changes this file and nothing
 * that calls it. Components never call `track()` themselves: they carry
 * `data-track` / `data-section` attributes and the listeners below do it.
 */

import type { PostHogConfig } from "posthog-js";
import { readAttribution, type Attribution } from "./attribution";

export type Properties = Record<string, unknown>;

/** The subset of posthog-js this wrapper uses; tests pass a fake. */
export interface PostHogClient {
  init(key: string, config: Partial<PostHogConfig>): unknown;
  capture(event: string, properties?: Properties): unknown;
  identify(id: string, traits?: Properties): void;
  register(properties: Properties): void;
  get_distinct_id(): string;
}

export interface Analytics {
  track(event: string, properties?: Properties): void;
  /** Records a page view. Called once on load; the page has no client-side routing. */
  page(): void;
  identify(id: string, traits?: Properties): void;
  /** The visitor's analytics ID, sent with form submissions so the server can record the conversion against it. Null until loaded, and always null without a key. */
  anonymousId(): string | null;
  /** UTM tags and referrer from the landing URL, for forms to submit alongside the lead. */
  attribution(): Attribution;
}

export interface AnalyticsOptions {
  /** PostHog project key. Without one, every call is a no-op and posthog-js is never downloaded. */
  key?: string;
  host?: string;
  /** The landing URL, read once for UTM tags. */
  url: string;
  referrer?: string;
  /** Deployment environment (production, preview, development), attached to every event so QA traffic on previews can be filtered out. */
  environment?: string;
  /** An anonymous ID carried over from the previous page (see handoff.ts), to continue that visit instead of starting a new one. */
  distinctId?: string;
  /** Loads the provider. Defaults to a dynamic import so posthog-js is split out of the page bundle. */
  load?: () => Promise<PostHogClient>;
}

/**
 * Holds calls made before the provider loads and replays them, in order, once
 * it does. If it never loads (an ad blocker, or offline), held calls are
 * dropped and later ones are ignored rather than piling up for the life of
 * the page.
 */
export function createReplayQueue<T>() {
  let target: T | null = null;
  let failed = false;
  const queue: Array<(target: T) => void> = [];
  return {
    run(call: (target: T) => void) {
      if (target) call(target);
      else if (!failed) queue.push(call);
    },
    ready(value: T) {
      target = value;
      for (const call of queue.splice(0)) call(value);
    },
    fail() {
      failed = true;
      queue.length = 0;
    },
    /** Calls waiting for the provider. */
    get pending() {
      return queue.length;
    },
    get current() {
      return target;
    },
  };
}

const defaultLoad = async (): Promise<PostHogClient> =>
  (await import("posthog-js")).default;

export function createAnalytics(options: AnalyticsOptions): Analytics {
  const attribution = readAttribution(options.url, options.referrer);

  if (!options.key) {
    return {
      track() {},
      page() {},
      identify() {},
      anonymousId: () => null,
      attribution: () => ({ ...attribution }),
    };
  }

  const key = options.key;
  const calls = createReplayQueue<PostHogClient>();
  const run = calls.run;

  (options.load ?? defaultLoad)()
    .then((ph) => {
      ph.init(key, {
        api_host: options.host,
        defaults: "2026-08-30",
        // No cookies or storage: the ID lives in memory for this page view.
        // Not `cookieless_mode`, which assigns identity on PostHog's servers
        // and so leaves no client ID for the lead endpoint to record the
        // conversion against.
        persistence: "memory",
        // Page views and clicks are recorded explicitly (see `page()` and
        // `bindClickTracking`), so the event stream is exactly the tracking
        // plan rather than every click on the page.
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: false,
        person_profiles: "identified_only",
        session_recording: { maskAllInputs: true },
        ...(options.distinctId && {
          bootstrap: { distinctID: options.distinctId, isIdentifiedID: false },
        }),
      });
      if (options.environment)
        ph.register({ environment: options.environment });
      calls.ready(ph);
    })
    .catch(() => {
      // Blocked by an ad blocker or offline: analytics is lost, the page isn't.
      calls.fail();
    });

  return {
    track(event, properties) {
      run((ph) => ph.capture(event, { ...attribution, ...properties }));
    },
    page() {
      run((ph) => ph.capture("$pageview", { ...attribution }));
    },
    identify(id, traits) {
      run((ph) => ph.identify(id, traits));
    },
    anonymousId: () => calls.current?.get_distinct_id() ?? null,
    attribution: () => ({ ...attribution }),
  };
}

/**
 * One page-level listener for every tracked click. An element opts in with
 * `data-track="CTA Clicked"` and describes itself with `data-location`,
 * `data-label` (defaults to its text) and `data-destination` (defaults to its
 * href).
 */
export function bindClickTracking(root: Document, analytics: Analytics): void {
  root.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const element = target.closest<HTMLElement>("[data-track]");
      if (!element?.dataset.track) return;
      analytics.track(element.dataset.track, {
        location: element.dataset.location,
        label: element.dataset.label ?? element.textContent?.trim(),
        destination:
          element.dataset.destination ??
          element.getAttribute("href") ??
          undefined,
      });
    },
    { capture: true },
  );
}

/** Fires `Section Viewed` once per `[data-section]`, when it reaches the middle of the viewport. */
export function observeSections(root: Document, analytics: Analytics): void {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = (entry.target as HTMLElement).dataset.section;
        analytics.track("Section Viewed", { section });
        observer.unobserve(entry.target);
      }
    },
    // Count a section as seen once its top passes 60% down the viewport;
    // a ratio threshold would never fire for sections taller than the screen.
    { rootMargin: "0px 0px -40% 0px" },
  );
  root
    .querySelectorAll<HTMLElement>("[data-section]")
    .forEach((element) => observer.observe(element));
}
