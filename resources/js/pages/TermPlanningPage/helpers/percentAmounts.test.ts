import { describe, expect, it } from "vitest";
import { formatPercent, parseFringeRate } from "./percentAmounts";

describe("formatPercent", () => {
  it("shows a fraction as a percent without trailing zeros", () => {
    expect(formatPercent(0.385)).toBe("38.5%");
    expect(formatPercent(1.1264)).toBe("112.64%");
    expect(formatPercent(0)).toBe("0%");
  });
});

describe("parseFringeRate", () => {
  it("reads a percent with or without the sign", () => {
    expect(parseFringeRate("38.5%")).toEqual({ fringeRate: 0.385 });
    expect(parseFringeRate("38.5")).toEqual({ fringeRate: 0.385 });
    expect(parseFringeRate(" 112.64 % ")).toEqual({ fringeRate: 1.1264 });
  });

  it("accepts 0% and 500%", () => {
    expect(parseFringeRate("0")).toEqual({ fringeRate: 0 });
    expect(parseFringeRate("500%")).toEqual({ fringeRate: 5 });
  });

  it("refuses what the server refuses", () => {
    expect(parseFringeRate("-1")).toHaveProperty("refusal");
    expect(parseFringeRate("500.01")).toHaveProperty("refusal");
    expect(parseFringeRate("12.345")).toHaveProperty("refusal");
    expect(parseFringeRate("abc")).toHaveProperty("refusal");
    expect(parseFringeRate("")).toHaveProperty("refusal");
  });
});
