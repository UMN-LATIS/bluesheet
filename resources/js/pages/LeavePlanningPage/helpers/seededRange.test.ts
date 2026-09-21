import { describe, expect, it } from "vitest";
import type { TermPayrollDate } from "@/types";
import { axisFor, fractionOf } from "./timelineAxis";
import { seededRangeFor } from "./seededRange";
import { FALL_2026, SPRING_2027, SUMMER_2026, TERMS } from "./planning.fixture";

const axis = axisFor(TERMS, {
  startTermCode: SUMMER_2026.termCode,
  endTermCode: SPRING_2027.termCode,
})!;

const payrollDate = (
  term_code: number,
  payroll_start_date: string,
  payroll_end_date: string,
): TermPayrollDate => ({
  id: term_code,
  term_code,
  semester: "Fall",
  year: 2026,
  payroll_start_date,
  payroll_end_date,
});

const PAYROLL_DATES = [
  payrollDate(FALL_2026.termCode, "2026-08-31", "2027-01-13"),
];

const midTerm = (startDate: string, endDate: string) =>
  (fractionOf(axis, startDate) + fractionOf(axis, endDate)) / 2;

describe("seededRangeFor", () => {
  it("uses the payroll period of the term under the click", () => {
    const range = seededRangeFor(
      axis,
      PAYROLL_DATES,
      midTerm("2026-09-08", "2026-12-23"),
    );

    expect(range).toEqual({
      startDate: "2026-08-31",
      endDate: "2027-01-13",
    });
  });

  it("falls back to the term's own dates when it has no payroll row", () => {
    const range = seededRangeFor(
      axis,
      PAYROLL_DATES,
      midTerm("2026-05-18", "2026-08-14"),
    );

    expect(range).toEqual({
      startDate: SUMMER_2026.startDate,
      endDate: SUMMER_2026.endDate,
    });
  });

  it("falls back for a term the hand-seeded table never reached", () => {
    const range = seededRangeFor(
      axis,
      PAYROLL_DATES,
      midTerm("2027-01-19", "2027-05-12"),
    );

    expect(range).toEqual({
      startDate: SPRING_2027.startDate,
      endDate: SPRING_2027.endDate,
    });
  });

  it("gives nothing for a click in the break between two terms", () => {
    const [breakBetweenTerms] = axis.gaps;
    const fraction = breakBetweenTerms.left + breakBetweenTerms.width / 2;

    expect(seededRangeFor(axis, PAYROLL_DATES, fraction)).toBeNull();
  });
});
