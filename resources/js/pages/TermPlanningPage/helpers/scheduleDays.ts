import { WEEK_DAYS, type SisDay } from "../types";

/**
 * The days a schedule is read along. Sections with no meeting time are a day
 * of their own, last in the row: a scheduler asking "what is unplaced?" is
 * asking the same kind of question as "what is on Tuesday?", and the answer
 * belongs in the same control rather than in a tray under the page.
 *
 * The week view draws these as columns and the day view as tabs, so the index
 * a component holds means the same thing in both.
 */
export const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const WEEKDAY_CODES: SisDay[] = ["mon", "tue", "wed", "thu", "fri"];

/** The Async day sits one past the last weekday. */
export const ASYNC_DAY_INDEX = WEEKDAY_NAMES.length;

export const DAY_TAB_NAMES = [...WEEKDAY_NAMES, "Async"];

/** How a day tab names itself in the URL, the Async tab included. */
export const DAY_TAB_CODES: string[] = [...WEEKDAY_CODES, "async"];

export const isAsyncDay = (dayIndex: number) => dayIndex === ASYNC_DAY_INDEX;

/** "Mon, Wed": the days one meeting pattern is on, in week order. */
export const daysMetSpelled = (days: SisDay[]): string =>
  WEEK_DAYS.filter((day) => days.includes(day))
    .map((day) => DAY_NAMES[day])
    .join(", ");

const DAY_NAMES: Record<SisDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/**
 * "MW", "TTh", or "Async": which days a section meets, as a scheduler writes
 * it. Built from every one of its patterns, so a class that meets at
 * different hours on different days still names all of them.
 */
export function daysMetLabel(
  patterns: { days: SisDay[] }[],
  shortNames: Record<SisDay, string> = SHORT_DAY_NAMES,
): string {
  const met = new Set(patterns.flatMap((pattern) => pattern.days));
  if (met.size === 0) return "Async";

  return WEEKDAY_CODES.filter((day) => met.has(day))
    .map((day) => shortNames[day])
    .join("");
}

/** How a day is written when several are run together, as in "TTh". */
const SHORT_DAY_NAMES: Record<SisDay, string> = {
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "Th",
  fri: "F",
  sat: "Sa",
  sun: "Su",
};
