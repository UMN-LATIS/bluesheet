/** One minute is one pixel; every column measures itself with these. */

// 8 to 21 covers every timed meeting in
// the pilot data, evening classes included
export const FIRST_HOUR = 8;
export const LAST_HOUR = 21;

const PIXELS_PER_MINUTE = 1;

/** Room for the first and last hour labels, which straddle their lines. */
const EDGE_SPACE = 8;

export const START_MINUTE = FIRST_HOUR * 60;
export const END_MINUTE = LAST_HOUR * 60;

/** Where a moment in the day sits, as a CSS length from the top of a column. */
export const topOf = (minute: number) =>
  `${(minute - START_MINUTE) * PIXELS_PER_MINUTE + EDGE_SPACE}px`;

export const heightOf = (startMinute: number, endMinute: number) =>
  `${(endMinute - startMinute) * PIXELS_PER_MINUTE}px`;

export const COLUMN_HEIGHT = `${(END_MINUTE - START_MINUTE) * PIXELS_PER_MINUTE + EDGE_SPACE * 2}px`;

/** Every standard class period begins on a five. */
export const SNAP_MINUTES = 5;

export function minuteAt(offsetY: number): number {
  return (offsetY - EDGE_SPACE) / PIXELS_PER_MINUTE + START_MINUTE;
}

export function snapToGrid(minute: number): number {
  const snapped = Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(Math.max(snapped, START_MINUTE), END_MINUTE);
}

/** "10:10" → 610: the 24-hour clock times the SIS sends, as grid minutes. */
export function minutesFromClock(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

export function clockFromMinutes(minute: number): string {
  const hours = String(Math.floor(minute / 60)).padStart(2, "0");
  return `${hours}:${String(minute % 60).padStart(2, "0")}`;
}

/** "9:05" — no meridiem, since the clock beside it already gives the half. */
export function formatClock(minute: number): string {
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12}:${String(minute % 60).padStart(2, "0")}`;
}

const halfOfDay = (minute: number) =>
  Math.floor(minute / 60) < 12 ? "a" : "p";

/** "9:05", and "9" on the hour, where every character costs lane width. */
const formatClockBrief = (minute: number) =>
  minute % 60 === 0
    ? `${Math.floor(minute / 60) % 12 || 12}`
    : formatClock(minute);

/** "9:05a", "12p". */
export function formatClockWithHalf(minute: number): string {
  return `${formatClockBrief(minute)}${halfOfDay(minute)}`;
}

/**
 * "9 – 11a", "11:15a – 1:15p": the half is
 * left off the start when both ends share it.
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
