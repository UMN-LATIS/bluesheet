/**
 * Problems with a section as the form holds it. Scheduling rules (clashes,
 * rooms) are not here.
 */

import type { PlannedSection } from "../types";
import { minutesFromClock } from "../helpers/timeScale";

export interface Problem {
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
