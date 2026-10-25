// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Analytics } from "./analytics";
import { enhanceForm, enhanceSetupForm, sendLead, showErrors } from "./signup";

function fakeAnalytics() {
  return {
    track: vi.fn(),
    page: vi.fn(),
    identify: vi.fn(),
    anonymousId: () => "0192f3a4-5b6c-7d8e-9f01-23456789abcd",
    attribution: () => ({}),
  } satisfies Analytics;
}

function respond(status: number, body: unknown) {
  return vi.fn(async () => Response.json(body, { status }));
}

// The parts of GetStarted.astro that signup.ts relies on.
function renderSetup() {
  document.body.innerHTML = `
    <form action="/api/lead" data-lead-form="setup"
      data-counter="STEP {step} OF {total}" data-label-next="Continue"
      data-label-submit="Start free" data-label-demo="Book a demo"
      data-error-stands="Choose how many stands you run."
      data-error-email="Enter an email address." data-network-error="Offline.">
      <input type="hidden" name="intent" value="signup">
      <div data-steps>
        <div data-step="stands"><p data-step-of></p><div data-progress></div>
          <legend data-question tabindex="-1">How many?</legend>
          <input type="radio" name="stands" value="2-5">
          <input type="radio" name="stands" value="20+">
          <p data-error-for="stands" hidden></p></div>
        <div data-step="sells"><p data-step-of></p><div data-progress></div>
          <legend data-question tabindex="-1">What?</legend>
          <input type="checkbox" name="sells" value="drinks"></div>
        <div data-step="email"><p data-step-of></p><div data-progress></div>
          <label data-question tabindex="-1" for="e">Email</label>
          <input id="e" type="email" name="email" required>
          <p data-error-for="email" hidden></p></div>
        <p data-error-for="form" hidden></p>
        <button type="button" data-back hidden>Back</button>
        <button type="submit" data-next>Start free</button>
      </div>
      <div data-success hidden tabindex="-1">Done</div>
    </form>`;
  return document.querySelector("form")!;
}

const $ = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const visibleStep = () =>
  [...document.querySelectorAll<HTMLElement>("[data-step]")].find(
    (step) => !step.hidden,
  )?.dataset.step;
const submit = (form: HTMLFormElement) =>
  form.dispatchEvent(new Event("submit", { cancelable: true }));
const choose = (selector: string) => {
  $<HTMLInputElement>(selector).checked = true;
  $("form").dispatchEvent(new Event("change", { bubbles: true }));
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("sendLead", () => {
  it("posts the form as JSON and records the submission", async () => {
    const form = renderSetup();
    $<HTMLInputElement>('[name="email"]').value = "gob@bluth.com";
    const analytics = fakeAnalytics();
    const fetchImpl = respond(200, { ok: true });

    const result = await sendLead(form, analytics, fetchImpl);

    expect(result).toEqual({ ok: true, errors: {} });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toMatch(/\/api\/lead$/);
    expect(JSON.parse(init.body as string)).toMatchObject({
      intent: "signup",
      email: "gob@bluth.com",
    });
    expect(analytics.track).toHaveBeenCalledWith("Form Submitted", {
      form: "setup",
    });
  });

  it("reports the server's field errors as a Form Error", async () => {
    const form = renderSetup();
    const analytics = fakeAnalytics();
    const result = await sendLead(
      form,
      analytics,
      respond(422, { ok: false, errors: { email: "Bad email." } }),
    );
    expect(result).toEqual({ ok: false, errors: { email: "Bad email." } });
    expect(analytics.track).toHaveBeenCalledWith("Form Error", {
      form: "setup",
      fields: ["email"],
    });
  });

  it("turns a network failure into the form's own message", async () => {
    const form = renderSetup();
    const result = await sendLead(
      form,
      fakeAnalytics(),
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    expect(result.errors).toEqual({ network: "Offline." });
  });
});

describe("showErrors", () => {
  it("puts each message by its field, and the rest at the form level", () => {
    const form = renderSetup();
    showErrors(form, { email: "Bad email.", network: "Offline." });
    expect($('[data-error-for="email"]').textContent).toBe("Bad email.");
    expect($('[data-error-for="form"]').textContent).toBe("Offline.");
    expect($('[data-error-for="stands"]').hidden).toBe(true);
  });
});

describe("enhanceSetupForm", () => {
  it("asks one question at a time and sends the answers at the end", async () => {
    const form = renderSetup();
    const analytics = fakeAnalytics();
    const fetchImpl = respond(200, { ok: true });
    enhanceSetupForm(form, analytics, fetchImpl);
    expect(visibleStep()).toBe("stands");
    expect($("[data-step-of]").textContent).toBe("STEP 1 OF 3");
    expect($("[data-next]").textContent).toBe("Continue");

    submit(form);
    expect(visibleStep()).toBe("stands");
    expect($('[data-error-for="stands"]').hidden).toBe(false);

    choose('[value="2-5"]');
    submit(form);
    expect(visibleStep()).toBe("sells");
    expect(analytics.track).toHaveBeenCalledWith("Form Step Completed", {
      form: "setup",
      step: "stands",
      step_number: 1,
      stands: "2-5",
    });

    choose('[value="drinks"]');
    submit(form);
    expect(visibleStep()).toBe("email");
    expect($("[data-next]").textContent).toBe("Start free");

    $<HTMLInputElement>('[name="email"]').value = "gob@bluth.com";
    submit(form);
    await vi.waitFor(() => expect($("[data-success]").hidden).toBe(false));
    const body = JSON.parse(
      (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    );
    expect(body).toMatchObject({
      stands: "2-5",
      sells: ["drinks"],
      email: "gob@bluth.com",
    });
  });

  it("skips the email question when the hero form already took it", async () => {
    const form = renderSetup();
    const fetchImpl = respond(200, { ok: true });
    const setup = enhanceSetupForm(form, fakeAnalytics(), fetchImpl);
    setup.useEmail("gob@bluth.com");
    expect($("[data-step-of]").textContent).toBe("STEP 1 OF 2");

    choose('[value="2-5"]');
    submit(form);
    expect($("[data-next]").textContent).toBe("Start free");
    submit(form);

    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    expect(visibleStep()).toBe("sells");
  });

  it("sends more than 20 stands to /demo, carrying the visit", () => {
    const form = renderSetup();
    const navigate = vi.fn();
    enhanceSetupForm(form, fakeAnalytics(), respond(200, {}), navigate);

    choose('[value="20+"]');
    expect($("[data-next]").textContent).toBe("Book a demo");
    submit(form);

    const url = new URL(navigate.mock.calls[0][0], "https://bluthsoft.test");
    expect(url.pathname).toBe("/demo");
    expect(url.searchParams.get("bs_stands")).toBe("20+");
    expect(url.searchParams.get("bs_vid")).toBeTruthy();
  });

  it("goes back to the email question when the server rejects it", async () => {
    const form = renderSetup();
    enhanceSetupForm(
      form,
      fakeAnalytics(),
      respond(422, { ok: false, errors: { email: "Bad email." } }),
    );
    choose('[value="2-5"]');
    submit(form);
    submit(form);
    $<HTMLInputElement>('[name="email"]').value = "gob@bluth.com";
    submit(form);

    await vi.waitFor(() =>
      expect($('[data-error-for="email"]').textContent).toBe("Bad email."),
    );
    expect(visibleStep()).toBe("email");
  });
});

describe("enhanceForm", () => {
  it("records the fields that fail the browser's checks, without sending", () => {
    document.body.innerHTML = `
      <form action="/api/lead" data-lead-form="hero">
        <input type="email" name="email" required>
      </form>`;
    const form = $<HTMLFormElement>("form");
    const analytics = fakeAnalytics();
    const fetchImpl = respond(200, { ok: true });
    enhanceForm(form, analytics, vi.fn(), fetchImpl);

    submit(form);

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(analytics.track).toHaveBeenCalledWith("Form Error", {
      form: "hero",
      fields: ["email"],
    });
  });

  it("calls back with the submitted data once the lead is saved", async () => {
    document.body.innerHTML = `
      <form action="/api/lead" data-lead-form="hero">
        <input type="email" name="email" required value="gob@bluth.com">
      </form>`;
    const onSuccess = vi.fn();
    enhanceForm($("form"), fakeAnalytics(), onSuccess, respond(200, {}));

    submit($("form"));

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onSuccess.mock.calls[0][0].get("email")).toBe("gob@bluth.com");
  });
});
