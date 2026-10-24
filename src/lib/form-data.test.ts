import { describe, expect, it } from "vitest";
import { formDataToObject } from "./form-data";

describe("formDataToObject", () => {
  it("reads every field once, with sells as a list", () => {
    const form = new FormData();
    form.append("email", "gob@bluth.com");
    form.append("sells", "frozen-bananas");
    form.append("sells", "drinks");
    expect(formDataToObject(form)).toEqual({
      email: "gob@bluth.com",
      sells: ["frozen-bananas", "drinks"],
    });
  });
});
