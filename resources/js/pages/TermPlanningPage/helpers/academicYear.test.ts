import { describe, expect, it } from "vitest";
import { academicYearEndOf } from "./academicYear";

describe("academicYearEndOf", () => {
  it.each([
    [1269, 2027],
    [1273, 2027],
    [1275, 2027],
    [1279, 2028],
  ])("puts term %i in the academic year ending %i", (termCode, year) => {
    expect(academicYearEndOf(termCode)).toBe(year);
  });
});
