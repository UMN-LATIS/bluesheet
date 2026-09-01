/**
 * The vertical scale every column on the schedule grid shares.
 *
 * One minute of the day is one pixel tall, which keeps placing anything on the
 * grid a plain subtraction from the first hour. Every column measures itself
 * the same way, so the clock, the standard periods, and the days stay in step.
 */

export const FIRST_HOUR = 8;
export const LAST_HOUR = 18;

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

/** "9:05" — no meridiem, since the clock beside it already gives the half. */
export function formatClock(minute: number): string {
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12}:${String(minute % 60).padStart(2, "0")}`;
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
