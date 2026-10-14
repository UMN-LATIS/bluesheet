import type {
  PlannedSection,
  SisInstructor,
  SisSectionMeeting,
} from "../types";
import { chargedElsewhereReasonOf, unpaidReasonOf } from "./costReason";
import type { EnrollmentPoint } from "./enrollmentHistory";
import { daysMetLabel } from "./scheduleDays";
import { instructorsOfRecord, TA_ROLE } from "./sectionPeople";
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
  instructorName: string;
  /** Null when a line has no rate. */
  instructorCost: number | null;
  /**
   * The section this section's instructor cost is paid on.
   * Null when it is paid here, or on more than one section.
   */
  paidElsewhere: PaidElsewhere | null;
  assistantNames: string;
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
): BudgetRow {
  const lines = cost?.lines ?? [];
  const instructorLines = lines.filter(({ role }) => role !== "ta");
  const taLines = lines.filter(({ role }) => role === "ta");
  const assistantNames = assistantNamesOf(section);
  const isUnstaffed = instructorLines.some(
    ({ role }) => role === "unstaffedSection",
  );
  const leads = instructorsOfRecord(section.instructors);

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
    instructorName: instructorNameOf(leads, isUnstaffed, taLines.length > 0),
    instructorCost: sumOrNull(instructorLines),
    paidElsewhere: paidElsewhereOf(instructorLines, labelOfSection),
    assistantNames,
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
  const reason = first ? unpaidReasonOf(first.basis, labelOfSection) : null;
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

function instructorNameOf(
  leads: SisInstructor[],
  isUnstaffed: boolean,
  hasAssistants: boolean,
): string {
  if (isUnstaffed) return "TBA";

  if (leads.length === 0) return hasAssistants ? "Taught by TA" : "—";

  return leads
    .map(({ name, lastName }) => name ?? lastName ?? "Unknown")
    .join(", ");
}

function assistantNamesOf(section: PlannedSection): string {
  return section.instructors
    .filter(({ role }) => role === TA_ROLE)
    .map(({ lastName }) => lastName ?? "Unknown")
    .join(", ");
}

function taCostCellOf(
  taLines: CostLine[],
  labelOfSection: (sectionId: number) => string,
): TaCostCell {
  const chargedHereLines = taLines.filter(
    ({ basis }) => basis.kind !== "chargedOnOtherSection",
  );

  if (chargedHereLines.length > 0) {
    const dollars = sumOrNull(chargedHereLines);
    return dollars === null
      ? { kind: "missingRate" }
      : { kind: "amount", dollars };
  }

  const otherSectionBasis = taLines[0]?.basis;
  if (otherSectionBasis?.kind === "chargedOnOtherSection") {
    return {
      kind: "chargedOnOtherSection",
      sectionLabel: labelOfSection(otherSectionBasis.sectionId),
      reason: chargedElsewhereReasonOf(otherSectionBasis, labelOfSection),
    };
  }

  return { kind: "none" };
}

function sumOrNull(lines: CostLine[]): number | null {
  if (lines.some(({ amount }) => amount === null)) return null;

  return lines.reduce((total, { amount }) => total + (amount ?? 0), 0);
}
