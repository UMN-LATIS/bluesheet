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

const RED_HUE = 25;
const GREEN_HUE = 145;
const RED_UP_TO_FILL = 0.4;
const GREEN_FROM_FILL = 0.95;

const clampToUnit = (fraction: number) => Math.min(1, Math.max(0, fraction));

/** Red when under 40% full, green from 95%. */
export function fillColorOf({
  enrollmentTotal,
  enrollmentCap,
}: {
  enrollmentTotal: number;
  enrollmentCap: number;
}): string {
  const fill =
    enrollmentCap > 0 ? clampToUnit(enrollmentTotal / enrollmentCap) : 1;
  const redToGreenFraction = clampToUnit(
    (fill - RED_UP_TO_FILL) / (GREEN_FROM_FILL - RED_UP_TO_FILL),
  );
  const hue = RED_HUE + redToGreenFraction * (GREEN_HUE - RED_HUE);

  return `oklch(0.85 0.11 ${hue.toFixed(0)})`;
}

export interface PreviousOffering {
  termCode: number;
  termName: string;
  instructorLastName: string;
  meetingSummary: string;
  enrolledOfCap: string;
  fillColor: string;
}

/**
 * The section's offerings in earlier terms of the same
 * season, newest first.
 */
export function previousOfferingsOf(
  history: EnrollmentHistory,
  courseCode: string,
  section: string,
  termCode: number,
): PreviousOffering[] {
  const isSameSeason = (offering: EnrollmentHistorySection) =>
    offering.termCode % 10 === termCode % 10;

  return history.sections
    .filter(
      (offering) =>
        offering.courseCode === courseCode &&
        offering.section === section &&
        isSameSeason(offering),
    )
    .sort((a, b) => b.termCode - a.termCode)
    .map((offering) => ({
      termCode: offering.termCode,
      termName: termNameOf(offering.termCode),
      instructorLastName: offering.leadInstructorLastName ?? "—",
      meetingSummary: meetingSummaryOf(offering.meetings),
      enrolledOfCap: `${offering.enrollmentTotal}/${offering.enrollmentCap}`,
      fillColor: fillColorOf(offering),
    }));
}
