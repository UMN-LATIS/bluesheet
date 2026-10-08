import type { EnrollmentHistory, EnrollmentHistorySection } from "@/types";

/** `offering` is null in a term the section did not run. */
export interface EnrollmentPoint {
  termCode: number;
  offering: EnrollmentHistorySection | null;
}

export const historyKeyOf = (courseCode: string, section: string) =>
  `${courseCode}|${section}`;

/**
 * Keyed by `historyKeyOf`. Every series has one point per
 * term in `history.termCodes`, oldest first.
 */
export function enrollmentSeriesBySection(
  history: EnrollmentHistory,
): Map<string, EnrollmentPoint[]> {
  const offeringsByKey = Map.groupBy(history.sections, (offering) =>
    historyKeyOf(offering.courseCode, offering.section),
  );

  return new Map(
    [...offeringsByKey].map(([key, offerings]) => [
      key,
      history.termCodes.map((termCode) => ({
        termCode,
        offering: offerings.find((offering) => offering.termCode === termCode) ?? null,
      })),
    ]),
  );
}

const SEASON_LETTERS: Record<number, string> = { 3: "S", 5: "U", 9: "F" };

/** 1259 → "F25", 1263 → "S26". */
export function shortTermLabel(termCode: number): string {
  const seasonLetter = SEASON_LETTERS[termCode % 10] ?? "?";
  const twoDigitYear = String(Math.floor(termCode / 10) % 100).padStart(2, "0");

  return `${seasonLetter}${twoDigitYear}`;
}
