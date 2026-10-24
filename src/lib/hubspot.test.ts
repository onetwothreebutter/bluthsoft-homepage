import { describe, expect, it, vi } from "vitest";
import { hubspotFields, submitToHubSpot } from "./hubspot";
import type { Lead } from "./lead";

const lead: Lead = {
  email: "lucille@bluth.com",
  intent: "demo",
  source: "demo",
  name: "Lucille Bluth",
  stands: "20+",
  sells: ["Frozen bananas", "Drinks"],
  utm_source: "newsletter",
};

describe("hubspotFields", () => {
  it("maps the lead onto contact properties and leaves out empty ones", () => {
    expect(hubspotFields(lead)).toEqual([
      { objectTypeId: "0-1", name: "email", value: "lucille@bluth.com" },
      { objectTypeId: "0-1", name: "firstname", value: "Lucille Bluth" },
      { objectTypeId: "0-1", name: "lead_intent", value: "demo" },
      { objectTypeId: "0-1", name: "lead_source", value: "demo" },
      { objectTypeId: "0-1", name: "stands", value: "20+" },
      { objectTypeId: "0-1", name: "sells", value: "Frozen bananas;Drinks" },
      { objectTypeId: "0-1", name: "utm_source", value: "newsletter" },
    ]);
  });
});

describe("submitToHubSpot", () => {
  const config = { portalId: "123", formGuid: "abc-def" };
  const context = {
    pageUri: "https://bluthsoft-homepage.vercel.app/",
    pageName: "/",
  };

  it("posts the fields and page context to the form's v3 submit endpoint", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({ inlineMessage: "Thanks" }),
    );
    await submitToHubSpot(lead, config, context, fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.hsforms.com/submissions/v3/integration/submit/123/abc-def",
      expect.objectContaining({ method: "POST" }),
    );
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toEqual({
      fields: hubspotFields(lead),
      context,
    });
  });

  it("throws with HubSpot's explanation when the submission is rejected", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          '{"errors":[{"errorType":"FIELD_NOT_IN_FORM_DEFINITION"}]}',
          { status: 400 },
        ),
    );
    await expect(
      submitToHubSpot(lead, config, context, fetchImpl),
    ).rejects.toThrow(/400.*FIELD_NOT_IN_FORM_DEFINITION/);
  });

  it("gives up on a HubSpot that doesn't answer", async () => {
    // Never responds; only rejects when the request is aborted.
    const fetchImpl = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(init.signal?.reason),
          ),
        ),
    );
    await expect(
      submitToHubSpot(lead, config, context, fetchImpl, 20),
    ).rejects.toThrow(/timed out|timeout/i);
  });
});
