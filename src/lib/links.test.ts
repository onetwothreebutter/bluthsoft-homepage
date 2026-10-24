import { describe, expect, it } from "vitest";
import { isBuilt, trackCta, trackLink } from "./links";

describe("isBuilt", () => {
  it("knows the built pages, with or without a trailing slash or fragment", () => {
    expect(isBuilt("/")).toBe(true);
    expect(isBuilt("/#get-started")).toBe(true);
    expect(isBuilt("/demo")).toBe(true);
    expect(isBuilt("/privacy/")).toBe(true);
  });

  it("treats every other path as not built yet", () => {
    expect(isBuilt("/pricing")).toBe(false);
    expect(isBuilt("/sign-in")).toBe(false);
    expect(isBuilt("/privacy/cookies")).toBe(false);
  });
});

describe("trackLink", () => {
  it("records a fake-door click for a page that doesn't exist", () => {
    expect(trackLink("/pricing", "nav")).toEqual({
      "data-track": "Link Clicked",
      "data-location": "nav",
    });
  });

  it("leaves in-page anchors and built pages untracked", () => {
    expect(trackLink("/#product", "nav")).toEqual({});
    expect(trackLink("/privacy", "footer")).toEqual({});
  });
});

describe("trackCta", () => {
  it("records a CTA click wherever it points", () => {
    expect(trackCta("hero")).toEqual({
      "data-track": "CTA Clicked",
      "data-location": "hero",
    });
  });
});
