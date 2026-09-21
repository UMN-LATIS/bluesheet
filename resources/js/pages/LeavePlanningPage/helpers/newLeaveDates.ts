import type { TermPayrollDate } from "@/types";
import type { TimelineAxis } from "./timelineAxis";

export interface NewLeaveDates {
  startDate: string;
  endDate: string;
}

/**
 * The dates a new leave opens with, for a click at `fraction` across the
 * axis. Null when the click landed between two terms.
 */
export function newLeaveDatesAt(
  axis: TimelineAxis,
  payrollDates: TermPayrollDate[],
  fraction: number,
): NewLeaveDates | null {
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
