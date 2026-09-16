import type { PlanningTerm, PlanningTermRange } from "@/types";

const MS_PER_DAY = 86_400_000;

/** Days since the Unix epoch, for a "YYYY-MM-DD" date. */
export const dayNumberOf = (isoDate: string): number => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
};

export interface AxisTerm {
  term: PlanningTerm;
  /** 0–1 across the axis */
  left: number;
  width: number;
}

export interface AxisSpan {
  /** 0–1 across the axis, clamped to its ends */
  left: number;
  width: number;
  isClippedAtStart: boolean;
  isClippedAtEnd: boolean;
}

export interface AxisMonth {
  isoDate: string;
  left: number;
  label: string;
}

export interface TimelineAxis {
  startDate: string;
  endDate: string;
  dayCount: number;
  terms: AxisTerm[];
  gaps: { left: number; width: number }[];
  months: AxisMonth[];
}

type DatedTerm = PlanningTerm & { startDate: string; endDate: string };

const isDated = (term: PlanningTerm): term is DatedTerm =>
  term.startDate !== null && term.endDate !== null;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Null when either end of the range names a term with no
 * dates.
 */
export function axisFor(
  terms: PlanningTerm[],
  range: PlanningTermRange,
): TimelineAxis | null {
  const termsInRange = terms
    .filter(isDated)
    .filter(({ id }) => id >= range.startTermId && id <= range.endTermId)
    .sort((a, b) => a.id - b.id);

  const firstTerm = termsInRange.at(0);
  const lastTerm = termsInRange.at(-1);
  const hasBothEnds =
    firstTerm?.id === range.startTermId && lastTerm?.id === range.endTermId;
  if (!firstTerm || !lastTerm || !hasBothEnds) return null;

  const startDay = dayNumberOf(firstTerm.startDate);
  const dayCount = dayNumberOf(lastTerm.endDate) + 1 - startDay;
  const leftOf = (isoDate: string) =>
    (dayNumberOf(isoDate) - startDay) / dayCount;
  const rightOf = (isoDate: string) =>
    (dayNumberOf(isoDate) + 1 - startDay) / dayCount;

  const axisTerms = termsInRange.map((term) => ({
    term,
    left: leftOf(term.startDate),
    width: rightOf(term.endDate) - leftOf(term.startDate),
  }));

  const gaps = axisTerms.slice(1).map((following, index) => {
    const previous = axisTerms[index];
    const left = previous.left + previous.width;
    return { left, width: following.left - left };
  });

  return {
    startDate: firstTerm.startDate,
    endDate: lastTerm.endDate,
    dayCount,
    terms: axisTerms,
    gaps: gaps.filter(({ width }) => width > 0),
    months: monthsBetween(firstTerm.startDate, lastTerm.endDate).map(
      (isoDate) => ({ isoDate, left: leftOf(isoDate), label: monthLabelOf(isoDate) }),
    ),
  };
}

/** Inclusive of both dates, as a leave's end date is. */
export function spanOf(
  axis: TimelineAxis,
  startDate: string,
  endDate: string,
): AxisSpan {
  const startDay = dayNumberOf(axis.startDate);
  const toFraction = (day: number) =>
    Math.min(1, Math.max(0, (day - startDay) / axis.dayCount));

  const left = toFraction(dayNumberOf(startDate));
  const right = toFraction(dayNumberOf(endDate) + 1);

  return {
    left,
    width: right - left,
    isClippedAtStart: startDate < axis.startDate,
    isClippedAtEnd: endDate > axis.endDate,
  };
}

export const fractionOf = (axis: TimelineAxis, isoDate: string): number =>
  spanOf(axis, isoDate, isoDate).left;

export const isWithinAxis = (axis: TimelineAxis, isoDate: string): boolean =>
  isoDate >= axis.startDate && isoDate <= axis.endDate;

function monthsBetween(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  let [year, month] = startDate.split("-").map(Number);

  for (;;) {
    month += 1;
    if (month === 13) {
      year += 1;
      month = 1;
    }
    const isoDate = `${year}-${String(month).padStart(2, "0")}-01`;
    if (isoDate > endDate) return months;
    months.push(isoDate);
  }
}

function monthLabelOf(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  const name = MONTH_NAMES[month - 1];
  return month === 1 ? `${name} ${year}` : name;
}
