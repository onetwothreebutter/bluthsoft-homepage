import { describe, expect, it } from "vitest";
import { readAttribution } from "./attribution";

const landing =
  "https://bluthsoft-homepage.vercel.app/?utm_source=newsletter&utm_medium=email&utm_campaign=frozen-week&utm_term=&ref=x";

describe("readAttribution", () => {
  it("keeps the UTM tags that have values and ignores other parameters", () => {
    expect(readAttribution(landing)).toEqual({
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "frozen-week",
    });
  });

  it("records an external referrer but not one from this site", () => {
    expect(
      readAttribution(
        "https://bluthsoft-homepage.vercel.app/",
        "https://news.ycombinator.com/item?id=1",
      ),
    ).toEqual({ referrer: "https://news.ycombinator.com/item?id=1" });
    expect(
      readAttribution(
        "https://bluthsoft-homepage.vercel.app/",
        "https://bluthsoft-homepage.vercel.app/privacy",
      ),
    ).toEqual({});
  });

  it("ignores a referrer that isn't a URL", () => {
    expect(
      readAttribution("https://bluthsoft-homepage.vercel.app/", "not a url"),
    ).toEqual({});
  });
});
