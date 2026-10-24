// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Analytics } from "./analytics";
import { bindLeadForms, leadContext } from "./lead-form";

function fakeAnalytics(id: string | null = "visitor-1") {
  return {
    track: vi.fn(),
    page: vi.fn(),
    identify: vi.fn(),
    anonymousId: () => id,
    attribution: () => ({ utm_source: "newsletter", referrer: "" }),
  } satisfies Analytics;
}

function renderForm() {
  document.body.innerHTML = `
    <form data-lead-form="hero">
      <input name="email" />
      <button>Start free</button>
    </form>`;
  return document.querySelector("form")!;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("leadContext", () => {
  it("sends the analytics ID and attribution, leaving out empty values", () => {
    expect(leadContext(fakeAnalytics())).toEqual({
      distinct_id: "visitor-1",
      utm_source: "newsletter",
    });
  });

  it("sends no ID when analytics hasn't loaded", () => {
    expect(leadContext(fakeAnalytics(null))).not.toHaveProperty("distinct_id");
  });
});

describe("bindLeadForms", () => {
  it("records Form Started once, on the first input", () => {
    const form = renderForm();
    const analytics = fakeAnalytics();
    bindLeadForms(document, analytics);

    form.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("input", { bubbles: true }));

    expect(analytics.track).toHaveBeenCalledTimes(1);
    expect(analytics.track).toHaveBeenCalledWith("Form Started", {
      form: "hero",
    });
  });

  it("adds the lead context to the submitted data", () => {
    const form = renderForm();
    bindLeadForms(document, fakeAnalytics());

    // What the browser dispatches while building a submission's data.
    const formData = new FormData();
    formData.set("email", "gob@bluth.com");
    form.dispatchEvent(Object.assign(new Event("formdata"), { formData }));

    expect(Object.fromEntries(formData)).toEqual({
      email: "gob@bluth.com",
      distinct_id: "visitor-1",
      utm_source: "newsletter",
    });
  });
});
