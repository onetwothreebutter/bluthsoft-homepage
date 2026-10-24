import { describe, expect, it } from "vitest";
import { parseLead } from "./lead";

const signup = { email: "gob@bluth.com", intent: "signup", source: "hero" };

describe("parseLead", () => {
  it("accepts a minimal signup and normalises the email", () => {
    const result = parseLead({ ...signup, email: "  GOB@Bluth.com " });
    expect(result).toEqual({
      ok: true,
      lead: { email: "gob@bluth.com", intent: "signup", source: "hero" },
    });
  });

  it("explains a bad email in the visitor's terms", () => {
    expect(parseLead({ ...signup, email: "gob" })).toEqual({
      ok: false,
      errors: { email: "Enter an email address like you@yourstand.com." },
    });
  });

  it("asks for an email when the box was left empty", () => {
    for (const email of ["", "   "]) {
      expect(parseLead({ ...signup, email })).toEqual({
        ok: false,
        errors: { email: "Enter your email address." },
      });
    }
  });

  it("requires a name for a demo request", () => {
    const result = parseLead({
      email: "lucille@bluth.com",
      intent: "demo",
      source: "demo",
      name: "",
    });
    expect(result).toEqual({
      ok: false,
      errors: { name: "Tell us who to ask for." },
    });
  });

  it("only accepts the quiz's stand counts", () => {
    expect(parseLead({ ...signup, stands: "6-20" }).ok).toBe(true);
    expect(parseLead({ ...signup, stands: "a few" })).toEqual({
      ok: false,
      errors: { stands: "Choose how many stands you run." },
    });
  });

  it("treats empty optional fields from a form post as absent", () => {
    const result = parseLead({
      ...signup,
      stands: "",
      name: "",
      utm_source: "",
    });
    expect(result).toEqual({ ok: true, lead: signup });
  });

  it("keeps UTM tags and drops fields it doesn't know", () => {
    const result = parseLead({
      ...signup,
      utm_source: "newsletter",
      is_admin: "true",
    });
    expect(result).toEqual({
      ok: true,
      lead: { ...signup, utm_source: "newsletter" },
    });
  });

  it("rejects an unknown intent or source", () => {
    const result = parseLead({
      email: "gob@bluth.com",
      intent: "buy",
      source: "popup",
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual(["intent", "source"]);
  });
});

describe("parseLead: what you sell", () => {
  const base = { email: "gob@bluth.com", intent: "signup", source: "setup" };

  it("accepts the setup questions' answers", () => {
    const result = parseLead({ ...base, sells: ["frozen-bananas", "drinks"] });
    expect(result.ok && result.lead.sells).toEqual([
      "frozen-bananas",
      "drinks",
    ]);
  });

  it("rejects an answer the questions don't offer", () => {
    expect(parseLead({ ...base, sells: ["cornballers"] }).ok).toBe(false);
  });
});
