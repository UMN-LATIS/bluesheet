import { describe, expect, it } from "vitest";
import { refusalOfCredits } from "./creditAmounts";

describe("refusalOfCredits", () => {
  it("accepts whole credits from 0 to 40", () => {
    expect([0, 3, 40].map(refusalOfCredits)).toEqual([null, null, null]);
  });

  it("refuses fractions, negatives, and more than 40", () => {
    expect(refusalOfCredits(1.5)).toBe("Use whole credits.");
    expect(refusalOfCredits(-1)).toBe("Enter 0 to 40 credits.");
    expect(refusalOfCredits(41)).toBe("Enter 0 to 40 credits.");
  });
});
