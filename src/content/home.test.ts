import { describe, expect, it } from "vitest";
import { splitWords } from "../lib/words";
import { home, standsValues } from "./home";
import { footer, header } from "./navigation";
import { notFound, privacy, thanks } from "./pages";

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
  it("only links to homepage sections or same-site paths", () => {
    const hrefs = collectHrefs([
      home,
      header,
      footer,
      notFound,
      thanks,
      privacy,
    ]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^\/(#[a-z-]+|[a-z-]*)$/);
  });

  it("offers every stand-count answer the lead endpoint accepts, once each", () => {
    const values = home.getStarted.steps.stands.options.map(
      (option) => option.value,
    );
    expect(values).toEqual([...standsValues]);
  });

  // The hero card's animation (global.css) is timed for 3 stats and 9 bars,
  // and ends 5 seconds after it starts with a 12-word reply. Any longer and
  // WCAG 2.2.2 would need a way to pause it, so retime it before changing
  // these.
  it("fits the hero card's animation", () => {
    const { stats, chart, assistant } = home.hero.dashboard;
    const { before, emphasis, after } = assistant.message;
    expect(stats).toHaveLength(3);
    expect(chart).toHaveLength(9);
    expect(
      [before, emphasis, after].flatMap(splitWords).length,
    ).toBeLessThanOrEqual(12);
  });
});
