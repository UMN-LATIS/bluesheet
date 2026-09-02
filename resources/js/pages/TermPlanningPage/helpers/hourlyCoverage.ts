/**
 * How busy each hour of the week is. A cell counts every section meeting
 * during that hour, so a 9:45–11:00 section falls in both the 9 and the 10
 * band and a column cannot be added up. The day totals answer the other
 * question, counting each section once, and the legend says which is which.
 */

import type { Meeting } from "../types";
import { END_MINUTE, START_MINUTE } from "./timeScale";

export interface HourlyCoverage {
  rows: { startMinute: number; counts: number[] }[];
  /** Distinct sections meeting that day, so a column has an honest total. */
  dayTotals: number[];
  /** The fullest hour, which the colour steps and the legend measure against. */
  busiest: { count: number; dayIndex: number; startMinute: number } | null;
}

/**
 * The last band a week always shows. Evening classes past it are rare enough
 * that a row for each would leave the grid mostly empty, and `bandsFrom`
 * adds them back on the weeks that have one.
 */
const LAST_BAND_MINUTE = 19 * 60;

export function coverageByHour(
  meetings: Meeting[],
  dayCount: number,
): HourlyCoverage {
  const rows: HourlyCoverage["rows"] = [];
  let busiest: HourlyCoverage["busiest"] = null;

  for (const startMinute of bandsFrom(meetings)) {
    const counts = Array.from(
      { length: dayCount },
      (_, dayIndex) =>
        meetings.filter(
          (meeting) =>
            meeting.dayIndex === dayIndex && isDuring(meeting, startMinute),
        ).length,
    );

    counts.forEach((count, dayIndex) => {
      if (count > (busiest?.count ?? 0)) {
        busiest = { count, dayIndex, startMinute };
      }
    });

    rows.push({ startMinute, counts });
  }

  return { rows, dayTotals: dayTotalsOf(meetings, dayCount), busiest };
}

const isDuring = (meeting: Meeting, startMinute: number) =>
  meeting.startMinute < startMinute + 60 && meeting.endMinute > startMinute;

/**
 * 8 AM through 7 PM, and on past it where something actually meets: a
 * coverage view that leaves a class out is worse than one with a spare row.
 */
function bandsFrom(meetings: Meeting[]): number[] {
  const latestEnd = meetings.reduce(
    (latest, meeting) => Math.max(latest, meeting.endMinute),
    0,
  );
  const lastBand = Math.min(
    Math.max(LAST_BAND_MINUTE, Math.ceil((latestEnd - 60) / 60) * 60),
    END_MINUTE - 60,
  );

  const bands: number[] = [];
  for (let start = START_MINUTE; start <= lastBand; start += 60) {
    bands.push(start);
  }
  return bands;
}

/** A section meeting twice on one day is one section, not two. */
function dayTotalsOf(meetings: Meeting[], dayCount: number): number[] {
  return Array.from({ length: dayCount }, (_, dayIndex) => {
    const sections = new Set(
      meetings
        .filter((meeting) => meeting.dayIndex === dayIndex)
        .map((meeting) => meeting.sectionId ?? meeting.id),
    );
    return sections.size;
  });
}
