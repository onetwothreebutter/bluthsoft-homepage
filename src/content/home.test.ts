import { describe, expect, it } from "vitest";
import { home, standsValues } from "./home";

function collectHrefs(value: unknown, hrefs: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((item) => collectHrefs(item, hrefs));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "href" && typeof child === "string") hrefs.push(child);
      else collectHrefs(child, hrefs);
    }
  }
  return hrefs;
}

describe("home content", () => {
  it("only links to in-page anchors or same-site paths", () => {
    const hrefs = collectHrefs(home);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^(#[a-z-]+|\/[a-z-]*)$/);
  });

  it("offers every stand-count answer the lead endpoint accepts, once each", () => {
    const values = home.getStarted.steps.stands.options.map(
      (option) => option.value,
    );
    expect(values).toEqual([...standsValues]);
  });
});
