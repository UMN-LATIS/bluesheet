import type { EnrollmentHistory, EnrollmentHistorySection } from "@/types";
import { meetingSummaryOf } from "./budgetRows";

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
        offering:
          offerings.find((offering) => offering.termCode === termCode) ?? null,
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

const SEASON_NAMES: Record<number, string> = {
  3: "Spring",
  5: "Summer",
  9: "Fall",
};

/** 1259 → "Fall 2025". */
export function termNameOf(termCode: number): string {
  const year = 1900 + Math.floor(termCode / 10);

  return `${SEASON_NAMES[termCode % 10] ?? "Term"} ${year}`;
}

const LAST_FILL_STEP = 5;
const LOWEST_STEP_UP_TO_FILL = 0.4;
const HIGHEST_STEP_FROM_FILL = 0.95;

const clampToUnit = (fraction: number) => Math.min(1, Math.max(0, fraction));

export interface Enrollment {
  enrollmentTotal: number;
  enrollmentCap: number;
}

/**
 * 0 up to 40% full, `LAST_FILL_STEP` from 95% full, evenly
 * between. A section with no cap counts as full.
 */
export function enrollmentFillStepOf({
  enrollmentTotal,
  enrollmentCap,
}: Enrollment): number {
  const fill =
    enrollmentCap > 0 ? clampToUnit(enrollmentTotal / enrollmentCap) : 1;
  const fraction = clampToUnit(
    (fill - LOWEST_STEP_UP_TO_FILL) /
      (HIGHEST_STEP_FROM_FILL - LOWEST_STEP_UP_TO_FILL),
  );

  return Math.round(fraction * LAST_FILL_STEP);
}

export interface PreviousOffering {
  termCode: number;
  termName: string;
  /** False in a term the section did not run. */
  isOffered: boolean;
  instructorLastName: string;
  meetingSummary: string;
  enrolledOfCap: string;
  /** Null in a term the section did not run. */
  enrollment: Enrollment | null;
}

function previousOfferingOf({
  termCode,
  offering,
}: EnrollmentPoint): PreviousOffering {
  const termName = termNameOf(termCode);
  if (!offering) {
    return {
      termCode,
      termName,
      isOffered: false,
      instructorLastName: "—",
      meetingSummary: "",
      enrolledOfCap: "—",
      enrollment: null,
    };
  }

  return {
    termCode,
    termName,
    isOffered: true,
    instructorLastName: offering.leadInstructorLastName ?? "—",
    meetingSummary: meetingSummaryOf(offering.meetings),
    enrolledOfCap: `${offering.enrollmentTotal}/${offering.enrollmentCap}`,
    enrollment: offering,
  };
}

/**
 * One row per term in `history.termCodes`, newest first,
 * the same terms as the budget's enrollment tiles. Empty
 * when the section never ran in any of them.
 */
export function previousOfferingsOf(
  history: EnrollmentHistory,
  courseCode: string,
  section: string,
): PreviousOffering[] {
  const series = enrollmentSeriesBySection(history).get(
    historyKeyOf(courseCode, section),
  );

  return [...(series ?? [])].reverse().map(previousOfferingOf);
}
