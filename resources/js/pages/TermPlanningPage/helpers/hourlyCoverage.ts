/**
 * How busy each hour of each day is: the most meetings running at the same
 * moment within that hour. This is the measure the week view's column
 * packing uses to decide how many lanes a day needs, so the peak here is
 * the number behind the widest column there.
 */

import type { Meeting } from "../types";
import { END_MINUTE, START_MINUTE } from "./timeScale";

export interface HourlyCoverage {
  /** One row per hour of the grid, each with one count per day. */
  rows: { startMinute: number; counts: number[] }[];
  /** The largest count anywhere, which the colour scale is drawn against. */
  peak: number;
}

export function coverageByHour(
  meetings: Meeting[],
  dayCount: number,
): HourlyCoverage {
  const rows: HourlyCoverage["rows"] = [];
  let peak = 0;

  for (let start = START_MINUTE; start < END_MINUTE; start += 60) {
    const counts = Array.from({ length: dayCount }, (_, dayIndex) =>
      peakConcurrency(
        meetings.filter((meeting) => meeting.dayIndex === dayIndex),
        start,
        start + 60,
      ),
    );

    peak = Math.max(peak, ...counts);
    rows.push({ startMinute: start, counts });
  }

  return { rows, peak };
}

/**
 * The most meetings overlapping at one moment inside a window. Sweeps the
 * starts and ends in time order; a meeting ending as another starts does
 * not count as overlapping it, which is why ends sort before starts at the
 * same minute.
 */
function peakConcurrency(
  meetings: Meeting[],
  windowStart: number,
  windowEnd: number,
): number {
  const events: { minute: number; change: 1 | -1 }[] = [];

  for (const meeting of meetings) {
    const start = Math.max(meeting.startMinute, windowStart);
    const end = Math.min(meeting.endMinute, windowEnd);
    if (start >= end) continue;

    events.push({ minute: start, change: 1 }, { minute: end, change: -1 });
  }

  events.sort((a, b) => a.minute - b.minute || a.change - b.change);

  let running = 0;
  let most = 0;
  for (const { change } of events) {
    running += change;
    most = Math.max(most, running);
  }

  return most;
}
