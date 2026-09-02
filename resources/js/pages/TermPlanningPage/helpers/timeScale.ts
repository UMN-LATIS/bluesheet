/**
 * The vertical scale every column on the schedule grid shares.
 *
 * One minute of the day is one pixel tall, which keeps placing anything on the
 * grid a plain subtraction from the first hour. Every column measures itself
 * the same way, so the clock, the standard periods, and the days stay in step.
 */

// 8 to 21 covers every timed Anthropology meeting in the pilot data; about
// a tenth of them are evening classes, too many to leave off the grid.
export const FIRST_HOUR = 8;
export const LAST_HOUR = 21;

const PIXELS_PER_MINUTE = 1;

/**
 * Breathing room above the first hour and below the last, so their labels,
 * which straddle their own lines, are not clipped by the grid's edges.
 */
const EDGE_SPACE = 8;

export const START_MINUTE = FIRST_HOUR * 60;
export const END_MINUTE = LAST_HOUR * 60;

/** Where a moment in the day sits, as a CSS length from the top of a column. */
export const topOf = (minute: number) =>
  `${(minute - START_MINUTE) * PIXELS_PER_MINUTE + EDGE_SPACE}px`;

/** How tall a stretch of the day is, as a CSS length. */
export const heightOf = (startMinute: number, endMinute: number) =>
  `${(endMinute - startMinute) * PIXELS_PER_MINUTE}px`;

export const COLUMN_HEIGHT = `${(END_MINUTE - START_MINUTE) * PIXELS_PER_MINUTE + EDGE_SPACE * 2}px`;

/**
 * The grain the grid snaps to when someone drags out a time. Five minutes,
 * because every standard class period begins on a five, so snapping this
 * finely can still land exactly on one.
 */
export const SNAP_MINUTES = 5;

/** The inverse of `topOf`: which minute a distance down a column names. */
export function minuteAt(offsetY: number): number {
  return (offsetY - EDGE_SPACE) / PIXELS_PER_MINUTE + START_MINUTE;
}

/** To the nearest snap point, and never outside the hours the grid draws. */
export function snapToGrid(minute: number): number {
  const snapped = Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(Math.max(snapped, START_MINUTE), END_MINUTE);
}

/** "10:10" → 610: the 24-hour clock times the SIS sends, as grid minutes. */
export function minutesFromClock(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

/** 610 → "10:10": the inverse of `minutesFromClock`, in the SIS's own format. */
export function clockFromMinutes(minute: number): string {
  const hours = String(Math.floor(minute / 60)).padStart(2, "0");
  return `${hours}:${String(minute % 60).padStart(2, "0")}`;
}

/** "9:05" — no meridiem, since the clock beside it already gives the half. */
export function formatClock(minute: number): string {
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12}:${String(minute % 60).padStart(2, "0")}`;
}

/** Which half of the day a minute falls in, as one letter. */
const halfOfDay = (minute: number) =>
  Math.floor(minute / 60) < 12 ? "a" : "p";

/** "9:05", and "9" on the hour, where every character costs lane width. */
const formatClockBrief = (minute: number) =>
  minute % 60 === 0
    ? `${Math.floor(minute / 60) % 12 || 12}`
    : formatClock(minute);

/**
 * "9:05a", "12p" — for a block out on the grid, where the clock is columns
 * away and a whole "AM" would cost room the block needs for its class.
 */
export function formatClockWithHalf(minute: number): string {
  return `${formatClockBrief(minute)}${halfOfDay(minute)}`;
}

/**
 * "9 – 11a", "11:15a – 1:15p" — when a class runs, in as few characters as
 * say it unambiguously.
 *
 * A class contained in one half of the day marks only its end: a class
 * cannot end before it starts, so a reader seeing "9 – 11a" has no second
 * reading available.
 */
export function formatTimeRange(startMinute: number, endMinute: number) {
  const start =
    halfOfDay(startMinute) === halfOfDay(endMinute)
      ? formatClockBrief(startMinute)
      : formatClockWithHalf(startMinute);

  return `${start} – ${formatClockWithHalf(endMinute)}`;
}

/** "9:05 AM" — for tooltips and anywhere the hour is not already in view. */
export function formatTime(minute: number): string {
  return `${formatClock(minute)} ${Math.floor(minute / 60) < 12 ? "AM" : "PM"}`;
}

/** "9 AM" — the label for a whole hour on the clock. */
export function formatHour(minute: number): string {
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
}

function minutesEvery(step: number, from: number): number[] {
  const minutes: number[] = [];
  for (let minute = from; minute <= END_MINUTE; minute += step) {
    minutes.push(minute);
  }
  return minutes;
}

export const HOUR_MARKS = minutesEvery(60, START_MINUTE);
export const HALF_HOUR_MARKS = minutesEvery(60, START_MINUTE + 30);
