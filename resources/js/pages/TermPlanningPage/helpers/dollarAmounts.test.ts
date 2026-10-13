import { describe, expect, it } from "vitest";
import { refusalOfDollars } from "./dollarAmounts";

describe("refusalOfDollars", () => {
  it("accepts what the server accepts", () => {
    expect(refusalOfDollars(0)).toBeNull();
    expect(refusalOfDollars(12000.5)).toBeNull();
  });

  it("refuses negative amounts, fractions of a cent, and non-numbers", () => {
    expect(refusalOfDollars(-1)).not.toBeNull();
    expect(refusalOfDollars(1.005)).not.toBeNull();
    expect(refusalOfDollars(Number.NaN)).not.toBeNull();
  });
});
