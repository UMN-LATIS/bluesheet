/**
 * Pure rewrites of a section's meeting patterns;
 * the grid's blocks derive from these.
 */

import { GRID_DAYS } from "../helpers/sectionPlacement";
import { clockFromMinutes, minutesFromClock } from "../helpers/timeScale";
import type { SisDay, SisSectionMeeting } from "../types";
import { WEEK_DAYS } from "../types";
import type { Placement } from "./types";

/** The most common pattern in the data: a 75-minute period at 9:45. */
export const DEFAULT_PATTERN: SisSectionMeeting = {
  days: [],
  startTime: "09:45",
  endTime: "11:00",
};

/**
 * A pattern left with no days is dropped. An
 * index past the end starts a new pattern.
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
 * Moving one day out of a pattern splits it off; dropping onto a time the
 * section already meets at joins that pattern.
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

/**
 * Merges overlapping ranges on a day (touching ones are left alone), then
 * restates days with identical times as one pattern.
 */
export function withoutOverlaps(
  patterns: SisSectionMeeting[],
): SisSectionMeeting[] {
  const byTimes = new Map<string, SisDay[]>();

  for (const day of daysMet(patterns)) {
    for (const range of merged(rangesOn(patterns, day))) {
      const key = `${range.startTime}-${range.endTime}`;
      byTimes.set(key, [...(byTimes.get(key) ?? []), day]);
    }
  }

  return [...byTimes.entries()]
    .map(([key, days]) => {
      const [startTime, endTime] = key.split("-");
      return { days: inWeekOrder(days), startTime, endTime };
    })
    .sort(
      (a, b) => minutesFromClock(a.startTime) - minutesFromClock(b.startTime),
    );
}

const daysMet = (patterns: SisSectionMeeting[]) =>
  inWeekOrder(patterns.flatMap((pattern) => pattern.days));

const rangesOn = (patterns: SisSectionMeeting[], day: SisDay) =>
  patterns
    .filter((pattern) => pattern.days.includes(day))
    .map(({ startTime, endTime }) => ({ startTime, endTime }))
    .sort(
      (a, b) => minutesFromClock(a.startTime) - minutesFromClock(b.startTime),
    );

function merged(ranges: { startTime: string; endTime: string }[]) {
  return ranges.reduce<typeof ranges>((kept, range) => {
    const last = kept[kept.length - 1];
    const overlaps =
      last &&
      minutesFromClock(range.startTime) < minutesFromClock(last.endTime);

    if (!overlaps) return [...kept, range];

    const endTime =
      minutesFromClock(range.endTime) > minutesFromClock(last.endTime)
        ? range.endTime
        : last.endTime;

    return [...kept.slice(0, -1), { ...last, endTime }];
  }, []);
}

function inWeekOrder(days: SisDay[]): SisDay[] {
  return WEEK_DAYS.filter((day) => days.includes(day));
}
