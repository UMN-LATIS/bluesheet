import { describe, expect, it } from "vitest";
import { refusalOfHours } from "./hourAmounts";

describe("refusalOfHours", () => {
  it("accepts whole hours from 0 to 2080", () => {
    expect([0, 196, 2080].map(refusalOfHours)).toEqual([null, null, null]);
  });

  it("refuses text, fractions, and hours out of range", () => {
    expect(refusalOfHours(Number.NaN)).toBe("Enter a number.");
    expect(refusalOfHours(98.5)).toBe("Use whole hours.");
    expect(refusalOfHours(-1)).toBe("Enter 0 to 2080 hours.");
    expect(refusalOfHours(2081)).toBe("Enter 0 to 2080 hours.");
  });
});
