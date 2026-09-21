import type { TermPayrollDate } from "@/types";
import type { TimelineAxis } from "./timelineAxis";

export interface SeededRange {
  startDate: string;
  endDate: string;
}

/**
 * The dates a new leave opens with, for a click at `fraction` across the
 * axis. Null when the click landed between two terms, where there is no term
 * to seed from.
 *
 * Payroll dates are preferred because a leave is a paid period, but
 * `term_payroll_dates` covers only fall and spring from 2024 to 2030, so most
 * of the axis falls back to the term's own dates.
 */
export function seededRangeFor(
  axis: TimelineAxis,
  payrollDates: TermPayrollDate[],
  fraction: number,
): SeededRange | null {
  const axisTerm = axis.terms.find(
    ({ left, width }) => fraction >= left && fraction < left + width,
  );

  if (!axisTerm) return null;

  const payroll = payrollDates.find(
    ({ term_code }) => term_code === axisTerm.term.termCode,
  );

  if (payroll) {
    return {
      startDate: payroll.payroll_start_date,
      endDate: payroll.payroll_end_date,
    };
  }

  return {
    startDate: axisTerm.term.startDate,
    endDate: axisTerm.term.endDate,
  };
}
