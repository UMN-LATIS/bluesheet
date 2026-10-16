import type { TeachingHistory } from "@/types";
import type { PlannedSection } from "../types";
import { meetingSummaryOf, sectionLabelerOf } from "./budgetRows";
import { notPaidHereReasonOf } from "./costReason";
import { termNameOf, type Enrollment } from "./enrollmentHistory";
import { TA_ROLE } from "./sectionPeople";
import { sumOf } from "./sumOf";
import type { CostLine, SectionCost } from "./termEstimate";

export interface PersonTermSection {
  sectionId: number;
  label: string;
  title: string;
  component: string;
  meetingSummary: string;
  isTa: boolean;
  /**
   * This person's cost on the section. Null when a line
   * has no rate, undefined outside the Budget view.
   */
  amount: number | null | undefined;
  unpaidReason: string | null;
}

export interface TaughtSection {
  key: string;
  label: string;
  title: string;
  component: string;
  isTa: boolean;
  /** Null when the SIS has no enrollment for it. */
  enrolledOfCap: string | null;
  /** Null when the SIS has no enrollment for it. */
  enrollment: Enrollment | null;
}

export interface TaughtTerm {
  termCode: number;
  termName: string;
  sections: TaughtSection[];
}

const HISTORY_YEARS = 5;

/**
 * Term-code bounds for the five years before `termCode`.
 * Summer terms fall inside them.
 */
export const historyRangeOf = (termCode: number) => ({
  startTermCode: termCode - HISTORY_YEARS * 10,
  endTermCode: termCode - 1,
});

const isFallOrSpring = (termCode: number) =>
  termCode % 10 === 9 || termCode % 10 === 3;

function totalAmountOf(
  lines: CostLine[] | undefined,
): number | null | undefined {
  if (lines === undefined) return undefined;
  if (lines.some((line) => line.amount === null)) return null;

  return sumOf(lines.map(({ amount }) => amount));
}

function firstNotPaidHereReasonOf(
  lines: CostLine[] | undefined,
  labelOfSection: (sectionId: number) => string,
): string | null {
  if (lines === undefined) return null;

  return (
    lines
      .map(({ basis }) => notPaidHereReasonOf(basis, labelOfSection))
      .find((reason) => reason !== null) ?? null
  );
}

export function personTermSectionsOf(
  emplid: number,
  sections: PlannedSection[],
  costsBySectionId: Map<number, SectionCost> | null,
): PersonTermSection[] {
  const labelOfSection = sectionLabelerOf(sections);

  return sections
    .filter(({ isCancelled }) => !isCancelled)
    .flatMap((section) => {
      const role = section.instructors.find(
        (instructor) => instructor.emplid === emplid,
      )?.role;
      if (role === undefined) return [];

      const lines = costsBySectionId
        ?.get(section.id)
        ?.lines.filter((line) => line.emplid === emplid);
      const amount = totalAmountOf(lines);
      const unpaidReason = firstNotPaidHereReasonOf(lines, labelOfSection);

      return [
        {
          sectionId: section.id,
          label: `${section.catalogNumber}-${section.section}`,
          title: section.title,
          component: section.component,
          meetingSummary: meetingSummaryOf(section.meetings),
          isTa: role === TA_ROLE,
          amount,
          unpaidReason,
        },
      ];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Newest term first, and only terms the person taught in.
 */
export function taughtTermsOf(
  history: TeachingHistory,
  emplid: number,
): TaughtTerm[] {
  const taughtSections = history.sections.filter(
    ({ termCode, isPlanned, instructors }) =>
      !isPlanned &&
      isFallOrSpring(termCode) &&
      instructors.some((instructor) => instructor.emplid === emplid),
  );
  const sectionsByTerm = Map.groupBy(
    taughtSections,
    ({ termCode }) => termCode,
  );

  return [...sectionsByTerm]
    .sort(([a], [b]) => b - a)
    .map(([termCode, sections]) => ({
      termCode,
      termName: termNameOf(termCode),
      sections: sections
        .map((section) => ({
          key: section.key,
          label: `${section.subject} ${section.catalogNumber}-${section.section}`,
          title: section.title,
          component: section.component,
          isTa: section.instructors.some(
            (instructor) =>
              instructor.emplid === emplid && instructor.role === TA_ROLE,
          ),
          enrolledOfCap:
            section.enrollmentTotal === null
              ? null
              : `${section.enrollmentTotal}/${section.enrollmentCap}`,
          enrollment:
            section.enrollmentTotal === null
              ? null
              : {
                  enrollmentTotal: section.enrollmentTotal,
                  enrollmentCap: section.enrollmentCap,
                },
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }));
}
