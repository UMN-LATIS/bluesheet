import { describe, expect, it } from "vitest";
import { flattenQuery } from "./urlQuery";

describe("flattenQuery", () => {
  it("passes a plain query through", () => {
    expect(flattenQuery({ view: "day", day: "wed" })).toEqual({
      view: "day",
      day: "wed",
    });
  });

  it("takes the first of a repeated key", () => {
    expect(flattenQuery({ day: ["wed", "fri"] })).toEqual({ day: "wed" });
  });

  it("drops a key written with no value", () => {
    expect(flattenQuery({ day: null, view: "week" })).toEqual({
      view: "week",
    });
  });

  it("drops a repeated key whose first value is missing", () => {
    expect(flattenQuery({ day: [null, "fri"] })).toEqual({});
  });
});
