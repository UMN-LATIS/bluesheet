import type {
  PlannedSection,
  SisInstructor,
  SisSectionMeeting,
} from "../types";
import { lastNameFirst } from "@/utils/lastNameFirst";
import {
  chargedElsewhereExplanationOf,
  notPaidHereReasonOf,
} from "./costReason";
import type { EnrollmentPoint } from "./enrollmentHistory";
import { daysMetLabel } from "./scheduleDays";
import { instructorsOfRecord, TA_ROLE } from "./sectionPeople";
import { sumOf } from "./sumOf";
import type { CostLine, SectionCost } from "./termEstimate";
import { formatTimeRange, minutesFromClock } from "./timeScale";

export type TaCostCell =
  | { kind: "chargedOnOtherSection"; sectionLabel: string; reason: string }
  | { kind: "missingRate" }
  | { kind: "amount"; dollars: number }
  | { kind: "none" };

export interface PaidElsewhere {
  sectionLabel: string;
  reason: string;
}

export interface PeopleSummary {
  /**
   * The first person named, or a placeholder such as "TBA"
   * or "Taught by TA".
   */
  name: string;
  otherNames: string[];
  /**
   * "9403 · Assistant Professor". Null when the first
   * person has no job code.
   */
  jobLabel: string | null;
}

export interface BudgetRow {
  sectionId: number;
  courseLabel: string;
  component: string;
  title: string;
  meetingSummary: string;
  enrollmentTotal: number;
  enrollmentCap: number;
  history: EnrollmentPoint[];
  isCancelled: boolean;
  isUnstaffed: boolean;
  instructors: PeopleSummary;
  /** Null when a line has no rate. */
  instructorCost: number | null;
  /**
   * The section this section's instructor cost is paid on.
   * Null when it is paid here, or on more than one section.
   */
  paidElsewhere: PaidElsewhere | null;
  /** Null when the section has no TA. */
  assistants: PeopleSummary | null;
  taCostCell: TaCostCell;
  notes: string;
}

export const courseLabelOf = (section: PlannedSection) =>
  `${section.subject} ${section.catalogNumber}-${section.section}`;

export const sectionLabelerOf =
  (sections: PlannedSection[]) =>
  (sectionId: number): string => {
    const section = sections.find(({ id }) => id === sectionId);
    return section ? courseLabelOf(section) : "another section";
  };

export function budgetRowOf(
  section: PlannedSection,
  cost: SectionCost | undefined,
  history: EnrollmentPoint[],
  labelOfSection: (sectionId: number) => string,
  jobLabelOf: (emplid: number) => string | null,
): BudgetRow {
  const lines = cost?.lines ?? [];
  const instructorLines = lines.filter(({ role }) => role !== "ta");
  const taLines = lines.filter(({ role }) => role === "ta");
  const assistants = section.instructors.filter(({ role }) => role === TA_ROLE);
  const isUnstaffed = instructorLines.some(
    ({ role }) => role === "unstaffedSection",
  );
  const leads = isUnstaffed ? [] : instructorsOfRecord(section.instructors);
  const placeholderName = placeholderNameOf(isUnstaffed, taLines.length > 0);

  return {
    sectionId: section.id,
    courseLabel: courseLabelOf(section),
    component: section.component,
    title: section.title,
    meetingSummary: meetingSummaryOf(section.meetings),
    enrollmentTotal: section.enrollmentTotal,
    enrollmentCap: section.enrollmentCap,
    history,
    isCancelled: section.isCancelled,
    isUnstaffed,
    instructors: peopleSummaryOf(leads, jobLabelOf) ?? {
      name: placeholderName,
      otherNames: [],
      jobLabel: null,
    },
    instructorCost: sumOrNull(instructorLines),
    paidElsewhere: paidElsewhereOf(instructorLines, labelOfSection),
    assistants: peopleSummaryOf(assistants, jobLabelOf),
    taCostCell: taCostCellOf(taLines, labelOfSection),
    notes: section.notes,
  };
}

function paidSectionIdOf({ basis }: CostLine): number | null {
  if (basis.kind === "paidOnLecture") return basis.lectureSectionId;
  if (basis.kind === "chargedOnOtherSection") return basis.sectionId;

  return null;
}

function paidElsewhereOf(
  instructorLines: CostLine[],
  labelOfSection: (sectionId: number) => string,
): PaidElsewhere | null {
  const paidSectionIds = new Set(instructorLines.map(paidSectionIdOf));
  const [onlyPaidSectionId] = paidSectionIds;
  const [first] = instructorLines;
  const reason = first
    ? notPaidHereReasonOf(first.basis, labelOfSection)
    : null;
  if (paidSectionIds.size !== 1 || onlyPaidSectionId == null || !reason) {
    return null;
  }

  return { sectionLabel: labelOfSection(onlyPaidSectionId), reason };
}

/** "MW 11:15a – 12:30p", from the first meeting's time. */
export function meetingSummaryOf(meetings: SisSectionMeeting[]): string {
  const [first] = meetings;
  if (!first) return "Async";

  const time = formatTimeRange(
    minutesFromClock(first.startTime),
    minutesFromClock(first.endTime),
  );

  return `${daysMetLabel(meetings)} ${time}`;
}

function placeholderNameOf(isUnstaffed: boolean, hasAssistants: boolean) {
  if (isUnstaffed) return "TBA";

  return hasAssistants ? "Taught by TA" : "—";
}

function nameOf({ name, lastName }: SisInstructor): string {
  if (name === null) return lastName ?? "Unknown";

  return lastNameFirst(name, lastName);
}

function peopleSummaryOf(
  people: SisInstructor[],
  jobLabelOf: (emplid: number) => string | null,
): PeopleSummary | null {
  const [first, ...others] = people;
  if (!first) return null;

  return {
    name: nameOf(first),
    otherNames: others.map(nameOf),
    jobLabel: jobLabelOf(first.emplid),
  };
}

function taCostCellOf(
  taLines: CostLine[],
  labelOfSection: (sectionId: number) => string,
): TaCostCell {
  const chargedHereLines = taLines.filter(
    ({ basis }) =>
      basis.kind !== "chargedOnOtherSection" && basis.kind !== "paidOnLecture",
  );

  if (chargedHereLines.length > 0) {
    const dollars = sumOrNull(chargedHereLines);
    return dollars === null
      ? { kind: "missingRate" }
      : { kind: "amount", dollars };
  }

  const otherSectionBasis = taLines[0]?.basis;
  switch (otherSectionBasis?.kind) {
    case "chargedOnOtherSection":
      return {
        kind: "chargedOnOtherSection",
        sectionLabel: labelOfSection(otherSectionBasis.sectionId),
        reason: chargedElsewhereExplanationOf(
          otherSectionBasis,
          labelOfSection,
        ),
      };
    case "paidOnLecture":
      return {
        kind: "chargedOnOtherSection",
        sectionLabel: labelOfSection(otherSectionBasis.lectureSectionId),
        reason: notPaidHereReasonOf(otherSectionBasis, labelOfSection) ?? "",
      };
  }

  return { kind: "none" };
}

function sumOrNull(lines: CostLine[]): number | null {
  if (lines.some(({ amount }) => amount === null)) return null;

  return sumOf(lines.map(({ amount }) => amount));
}
