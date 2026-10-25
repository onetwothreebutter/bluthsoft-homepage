import { describe, expect, it } from "vitest";
import { splitWords } from "./words";

describe("splitWords", () => {
  it("keeps each word's trailing space, so the words join back into the text", () => {
    const text = "You're likely to run out of frozen bananas by ";
    expect(splitWords(text)).toEqual([
      "You're ",
      "likely ",
      "to ",
      "run ",
      "out ",
      "of ",
      "frozen ",
      "bananas ",
      "by ",
    ]);
    expect(splitWords(text).join("")).toBe(text);
  });

  it("leaves punctuation without a space before it as its own word", () => {
    expect(splitWords(".")).toEqual(["."]);
    expect(splitWords("3:40 PM")).toEqual(["3:40 ", "PM"]);
  });
});
