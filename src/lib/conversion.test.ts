import { describe, expect, it } from "vitest";
import { conversionEvent } from "./conversion";

describe("conversionEvent", () => {
  it("names signups and demo requests differently", () => {
    const base = {
      email: "gob@bluth.com",
      source: "setup" as const,
      distinct_id: "anon-1",
    };
    expect(conversionEvent({ ...base, intent: "signup" }).event).toBe(
      "Lead Created",
    );
    expect(conversionEvent({ ...base, intent: "demo" }).event).toBe(
      "Demo Requested",
    );
  });

  it("records against the visitor's analytics ID and never includes the email", () => {
    const event = conversionEvent({
      email: "gob@bluth.com",
      intent: "signup",
      source: "hero",
      distinct_id: "anon-1",
      utm_campaign: "frozen-week",
    });
    expect(event.distinctId).toBe("anon-1");
    expect(event.properties).toMatchObject({
      source: "hero",
      utm_campaign: "frozen-week",
    });
    expect(JSON.stringify(event)).not.toContain("gob@bluth.com");
  });

  it("falls back to a fresh ID when the form was posted without JavaScript", () => {
    const event = conversionEvent(
      { email: "gob@bluth.com", intent: "signup", source: "setup" },
      { newId: () => "generated" },
    );
    expect(event.distinctId).toBe("generated");
  });

  it("carries the deployment environment, so preview QA can be filtered out", () => {
    const event = conversionEvent(
      { email: "gob@bluth.com", intent: "signup", source: "hero" },
      { environment: "preview" },
    );
    expect(event.properties).toMatchObject({ environment: "preview" });
  });
});
