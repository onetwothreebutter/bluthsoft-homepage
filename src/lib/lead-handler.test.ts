import { describe, expect, it, vi } from "vitest";
import { handleLead, redactEmail, type LeadHandlerDeps } from "./lead-handler";

const endpoint = "https://bluthsoft-homepage.vercel.app/api/lead";
const signup = {
  email: "gob@bluth.com",
  intent: "signup",
  source: "setup",
  stands: "2-5",
  distinct_id: "anon-1",
};

function json(body: unknown) {
  return new Request(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      referer: "https://bluthsoft-homepage.vercel.app/",
    },
    body: JSON.stringify(body),
  });
}

function form(fields: Record<string, string>) {
  return new Request(endpoint, {
    method: "POST",
    headers: { referer: "https://bluthsoft-homepage.vercel.app/demo" },
    body: new URLSearchParams(fields),
  });
}

function deps(overrides: Partial<LeadHandlerDeps> = {}) {
  return {
    submit: vi.fn(async () => {}),
    record: vi.fn(async () => {}),
    log: { info: vi.fn(), error: vi.fn() },
    ...overrides,
  } satisfies LeadHandlerDeps;
}

const hubspot = { portalId: "123", formGuid: "abc" };
const posthog = { key: "phc_test", host: "https://us.i.posthog.com" };

describe("handleLead — stub mode (no HubSpot configured)", () => {
  it("accepts a valid lead, says it's a stub, and logs it redacted", async () => {
    const d = deps();
    const response = await handleLead(json(signup), d);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, stub: true });
    expect(d.submit).not.toHaveBeenCalled();
    expect(d.log.info).toHaveBeenCalledWith(
      expect.stringContaining("[lead:stub]"),
      expect.objectContaining({ email: "g•••@bluth.com" }),
    );
  });

  it("records no conversion without a PostHog key", async () => {
    const d = deps();
    await handleLead(json(signup), d);
    expect(d.record).not.toHaveBeenCalled();
  });
});

describe("handleLead — validation", () => {
  it("returns 422 with a message per field", async () => {
    const response = await handleLead(
      json({ ...signup, email: "gob" }),
      deps(),
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { email: "Enter an email address like you@yourstand.com." },
    });
  });

  it("returns 422 for a body that isn't JSON", async () => {
    const request = new Request(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const response = await handleLead(request, deps());
    expect(response.status).toBe(422);
  });
});

describe("handleLead — honeypot", () => {
  it("answers a bot exactly like a person but forwards and records nothing", async () => {
    const d = deps({ hubspot, posthog });
    const response = await handleLead(
      json({ ...signup, website: "http://spam.example" }),
      d,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, stub: false });
    expect(d.submit).not.toHaveBeenCalled();
    expect(d.record).not.toHaveBeenCalled();
  });
});

describe("handleLead — HubSpot and PostHog configured", () => {
  it("forwards the lead with the page it came from, then records the conversion", async () => {
    const d = deps({ hubspot, posthog });
    const response = await handleLead(json(signup), d);

    expect(await response.json()).toEqual({ ok: true, stub: false });
    expect(d.submit).toHaveBeenCalledWith(
      expect.objectContaining({ email: "gob@bluth.com", stands: "2-5" }),
      hubspot,
      { pageUri: "https://bluthsoft-homepage.vercel.app/", pageName: "/" },
    );
    expect(d.record).toHaveBeenCalledWith(
      expect.objectContaining({ event: "Lead Created", distinctId: "anon-1" }),
      posthog,
    );
  });

  it("returns 502 and records nothing when HubSpot rejects the lead", async () => {
    const d = deps({
      hubspot,
      posthog,
      submit: vi.fn(async () => {
        throw new Error("HubSpot rejected the submission (400)");
      }),
    });
    const response = await handleLead(json(signup), d);

    expect(response.status).toBe(502);
    expect(d.record).not.toHaveBeenCalled();
    expect(d.log.error).toHaveBeenCalled();
  });

  it("still succeeds when only the analytics event fails", async () => {
    const d = deps({
      hubspot,
      posthog,
      record: vi.fn(async () => {
        throw new Error("PostHog down");
      }),
    });
    const response = await handleLead(json(signup), d);

    expect(response.status).toBe(200);
    expect(d.log.error).toHaveBeenCalled();
  });
});

describe("handleLead — form posts without JavaScript", () => {
  const demo = {
    email: "lucille@bluth.com",
    intent: "demo",
    source: "demo",
    name: "Lucille",
    website: "",
  };

  it("redirects to /thanks on success", async () => {
    const response = await handleLead(form(demo), deps());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://bluthsoft-homepage.vercel.app/thanks",
    );
  });

  it("shows what to fix on a page that links back to the form", async () => {
    const response = await handleLead(form({ ...demo, name: "" }), deps());
    const html = await response.text();

    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain("Tell us who to ask for.");
    expect(html).toContain('href="/demo"');
    expect(html).toContain('name="robots" content="noindex"');
  });
});

describe("redactEmail", () => {
  it("keeps the first letter and the domain", () => {
    expect(redactEmail("lucille@bluth.com")).toBe("l•••@bluth.com");
  });
});
