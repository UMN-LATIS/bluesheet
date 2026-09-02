/** Per hour per day, the most meetings running at one moment. */

import type { Meeting } from "../types";
import { END_MINUTE, START_MINUTE } from "./timeScale";

export interface HourlyCoverage {
  rows: { startMinute: number; counts: number[] }[];
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

// ends sort before starts at the same minute: a meeting ending as another
// starts does not overlap it
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
