/**
 * What is wrong with a section as the form currently holds it. Pure, and
 * about the section rather than about the inputs, so the same rules will
 * hold when a save has a server to answer to.
 *
 * Nothing here is a scheduling rule (a clash with another class, a room too
 * small). Those are epic slice 10 and belong to the term, not one section.
 */

import type { PlannedSection } from "../types";
import { minutesFromClock } from "../helpers/timeScale";

export interface Problem {
  /** Which meeting pattern it is about, when it is about one. */
  patternIndex?: number;
  message: string;
}

export function sectionProblems(section: PlannedSection): Problem[] {
  const times = section.meetings.flatMap((pattern, patternIndex) =>
    minutesFromClock(pattern.endTime) > minutesFromClock(pattern.startTime)
      ? []
      : [{ patternIndex, message: "End must be after start" }],
  );

  const cap =
    section.enrollmentCap >= 0 && Number.isInteger(section.enrollmentCap)
      ? []
      : [{ message: "Enrollment cap must be a whole number, zero or more" }];

  const number =
    section.section.trim() === ""
      ? [{ message: "Section number cannot be empty" }]
      : [];

  return [...number, ...times, ...cap];
}
