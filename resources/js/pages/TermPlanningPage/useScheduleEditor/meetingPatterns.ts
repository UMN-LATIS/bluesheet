/**
 * Rewrites a section's meeting patterns, which is what every change to when
 * a class meets comes down to. A drag on the grid and a day toggle in the
 * sheet are two ways of asking for the same rewrite, so both land here and
 * the schedule has one way of saying where a section meets.
 *
 * Pure, and pattern-shaped rather than block-shaped: the grid's meetings are
 * derived from these, never the other way round.
 */

import { GRID_DAYS } from "../helpers/sectionPlacement";
import { clockFromMinutes } from "../helpers/timeScale";
import type { SisDay, SisSectionMeeting } from "../types";
import { WEEK_DAYS } from "../types";
import type { Placement } from "./types";

/** Which block was dragged, in the terms the patterns are written in. */
export interface PatternDay {
  day: SisDay;
  /** 24-hour clock, as the SIS writes it: "11:15". */
  startTime: string;
}

/**
 * The section's patterns with one of its days moved to where it was dropped.
 *
 * Dragging Wednesday out of an MWF pattern leaves MF behind and states
 * Wednesday separately, since the pattern is what says "these days, this
 * time" and Wednesday no longer agrees with it. Dropping it where the
 * section already meets at that hour joins that pattern instead of adding a
 * second one saying the same thing.
 */
export function withPlacement(
  patterns: SisSectionMeeting[],
  from: PatternDay,
  to: Placement,
): SisSectionMeeting[] {
  const day = GRID_DAYS[to.dayIndex];
  const startTime = clockFromMinutes(to.startMinute);
  const endTime = clockFromMinutes(to.endMinute);

  const remaining = patterns
    .map((pattern) =>
      pattern.startTime === from.startTime && pattern.days.includes(from.day)
        ? { ...pattern, days: pattern.days.filter((met) => met !== from.day) }
        : pattern,
    )
    .filter((pattern) => pattern.days.length > 0);

  const joined = remaining.find(
    (pattern) => pattern.startTime === startTime && pattern.endTime === endTime,
  );

  if (!joined) {
    return [...remaining, { days: [day], startTime, endTime }];
  }

  return remaining.map((pattern) =>
    pattern === joined
      ? { ...pattern, days: inWeekOrder([...pattern.days, day]) }
      : pattern,
  );
}

/** Days as a week reads them, and each of them once. */
function inWeekOrder(days: SisDay[]): SisDay[] {
  return WEEK_DAYS.filter((day) => days.includes(day));
}
