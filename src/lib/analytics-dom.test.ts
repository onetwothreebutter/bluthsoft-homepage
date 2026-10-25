// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bindClickTracking,
  bindTabTracking,
  observeSections,
  type Analytics,
} from "./analytics";
import { bindTabs } from "./tabs";

function fakeAnalytics() {
  return {
    track: vi.fn(),
    page: vi.fn(),
    identify: vi.fn(),
    anonymousId: () => null,
    attribution: () => ({}),
  } satisfies Analytics;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("bindClickTracking", () => {
  it("tracks a click on a child of a tracked link, labelled by its text and its href", () => {
    document.body.innerHTML =
      '<a data-track="CTA Clicked" data-location="hero" href="#get-started"><span>Start free</span></a>';
    const analytics = fakeAnalytics();
    bindClickTracking(document, analytics);

    document.querySelector("span")!.click();

    expect(analytics.track).toHaveBeenCalledWith("CTA Clicked", {
      location: "hero",
      label: "Start free",
      destination: "#get-started",
    });
  });

  it("prefers data-label and data-destination over the text and href", () => {
    document.body.innerHTML =
      '<button data-track="CTA Clicked" data-location="nav" data-label="Open menu" data-destination="menu">☰</button>';
    const analytics = fakeAnalytics();
    bindClickTracking(document, analytics);

    document.querySelector("button")!.click();

    expect(analytics.track).toHaveBeenCalledWith("CTA Clicked", {
      location: "nav",
      label: "Open menu",
      destination: "menu",
    });
  });

  it("ignores clicks outside tracked elements", () => {
    document.body.innerHTML = '<p><a href="/privacy">Privacy</a></p>';
    const analytics = fakeAnalytics();
    bindClickTracking(document, analytics);

    document.querySelector("a")!.click();

    expect(analytics.track).not.toHaveBeenCalled();
  });
});

describe("bindTabTracking", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function renderTabs() {
    document.body.innerHTML = `
      <div role="tablist">
        <button role="tab" data-location="product" aria-selected="true" tabindex="0">Inventory</button>
        <button role="tab" data-location="product" aria-selected="false" tabindex="-1">Sales</button>
        <button role="tab" data-location="product" aria-selected="false" tabindex="-1">Bluth AI</button>
      </div>`;
    bindTabs(document.querySelector<HTMLElement>('[role="tablist"]')!);
    return [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
  }
  const arrowRight = () =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

  it("records a tab chosen with the arrow keys once the visitor settles on it", () => {
    const [inventory] = renderTabs();
    const analytics = fakeAnalytics();
    bindTabTracking(document, analytics);

    inventory.focus();
    arrowRight();
    vi.advanceTimersByTime(300);
    arrowRight();
    vi.advanceTimersByTime(999);
    expect(analytics.track).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(analytics.track).toHaveBeenCalledOnce();
    expect(analytics.track).toHaveBeenCalledWith("Tab Selected", {
      location: "product",
      label: "Bluth AI",
    });
  });

  it("records a clicked tab, and nothing for clicking the one already shown", () => {
    const [inventory, sales] = renderTabs();
    const analytics = fakeAnalytics();
    bindTabTracking(document, analytics);

    inventory.click();
    vi.runAllTimers();
    expect(analytics.track).not.toHaveBeenCalled();

    sales.click();
    vi.runAllTimers();
    sales.click();
    vi.runAllTimers();
    expect(analytics.track).toHaveBeenCalledOnce();
    expect(analytics.track).toHaveBeenCalledWith("Tab Selected", {
      location: "product",
      label: "Sales",
    });
  });
});

describe("observeSections", () => {
  // A stand-in IntersectionObserver the test drives by hand.
  class FakeObserver {
    static last: FakeObserver;
    readonly observed = new Set<Element>();
    constructor(private readonly callback: IntersectionObserverCallback) {
      FakeObserver.last = this;
    }
    observe(element: Element) {
      this.observed.add(element);
    }
    unobserve(element: Element) {
      this.observed.delete(element);
    }
    disconnect() {
      this.observed.clear();
    }
    /** Reports an element's intersection, as the browser would while it's still observed. */
    report(element: Element, isIntersecting: boolean) {
      if (!this.observed.has(element)) return;
      this.callback(
        [{ target: element, isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
  }

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires Section Viewed once per section, only when it comes into view", () => {
    document.body.innerHTML =
      '<section data-section="hero"></section><section data-section="automation"></section>';
    const analytics = fakeAnalytics();
    observeSections(document, analytics);
    const [hero, automation] = document.querySelectorAll("section");

    FakeObserver.last.report(automation!, false);
    FakeObserver.last.report(hero!, true);
    FakeObserver.last.report(hero!, true);

    expect(analytics.track).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith("Section Viewed", {
      section: "hero",
    });
  });
});
