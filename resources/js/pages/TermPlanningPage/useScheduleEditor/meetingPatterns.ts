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

/**
 * What a new pattern starts at: the most common meeting in the data, 244 of
 * them, and a standard 75-minute period.
 */
export const DEFAULT_PATTERN: SisSectionMeeting = {
  days: [],
  startTime: "09:45",
  endTime: "11:00",
};

/**
 * The patterns with one day of one of them turned on or off.
 *
 * A pattern left with no days is dropped rather than kept as a time nothing
 * meets at, so unchecking the last day is the same statement as pressing
 * Async. An index past the end starts a pattern, which is how a section with
 * no set time gets its first one.
 */
export function withDayToggled(
  patterns: SisSectionMeeting[],
  patternIndex: number,
  day: SisDay,
): SisSectionMeeting[] {
  const pattern = patterns[patternIndex];

  if (!pattern) {
    return [...patterns, { ...DEFAULT_PATTERN, days: [day] }];
  }

  const days = pattern.days.includes(day)
    ? pattern.days.filter((met) => met !== day)
    : inWeekOrder([...pattern.days, day]);

  return patterns.flatMap((held, index) =>
    index === patternIndex
      ? days.length === 0
        ? []
        : [{ ...held, days }]
      : [held],
  );
}

/** The patterns with one of them moved to a new start or end time. */
export function withTimes(
  patterns: SisSectionMeeting[],
  patternIndex: number,
  times: Partial<Pick<SisSectionMeeting, "startTime" | "endTime">>,
): SisSectionMeeting[] {
  return patterns.map((pattern, index) =>
    index === patternIndex ? { ...pattern, ...times } : pattern,
  );
}

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
