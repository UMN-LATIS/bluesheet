import { describe, expect, it } from "vitest";
import { refusalOfAppointmentPercent, refusalOfHours } from "./hourAmounts";

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

describe("refusalOfAppointmentPercent", () => {
  it("accepts 0 to 100%, fractions included", () => {
    expect([0, 12.5, 100].map(refusalOfAppointmentPercent)).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("refuses a non-number", () => {
    expect(refusalOfAppointmentPercent(Number.NaN)).toBe("Enter a number.");
    expect(refusalOfAppointmentPercent(Infinity)).toBe("Enter a number.");
  });

  it("refuses a percent outside 0 to 100", () => {
    expect(refusalOfAppointmentPercent(-1)).toBe("Enter 0 to 100%.");
    expect(refusalOfAppointmentPercent(100.5)).toBe("Enter 0 to 100%.");
  });
});
