import type { PlannedSection } from "../types";
import { describeCostBasis } from "./costBasis";
import type { EnrollmentPoint } from "./enrollmentHistory";
import { daysMetLabel } from "./scheduleDays";
import { instructorsOfRecord, TA_ROLE } from "./sectionPeople";
import type { CostLine, SectionCost } from "./termEstimate";
import { formatTimeRange, minutesFromClock } from "./timeScale";

export type TaCostCell =
  | { kind: "chargedOnOtherSection"; sectionLabel: string }
  | { kind: "missingRate" }
  | { kind: "amount"; dollars: number }
  | { kind: "none" };

export interface BudgetRow {
  sectionId: number;
  courseLabel: string;
  component: string;
  title: string;
  meetingSummary: string;
  enrollmentCap: number;
  history: EnrollmentPoint[];
  isCancelled: boolean;
  isUnstaffed: boolean;
  instructorName: string;
  /**
   * How the instructor cost was reached. Empty when nothing
   * was costed.
   */
  instructorBasisLabel: string;
  /**
   * Null when a line has no rate and no setting stands in
   * for one.
   */
  instructorCost: number | null;
  hasInstructorOverride: boolean;
  assistantNames: string;
  /**
   * How the TA cost was reached. Empty when no TA is
   * charged on this section.
   */
  taBasisLabel: string;
  taCostCell: TaCostCell;
  notes: string;
}

export const courseLabelOf = (section: PlannedSection) =>
  `${section.subject} ${section.catalogNumber}-${section.section}`;

export function budgetRowOf(
  section: PlannedSection,
  cost: SectionCost | undefined,
  history: EnrollmentPoint[],
  labelOfSection: (sectionId: number) => string,
): BudgetRow {
  const lines = cost?.lines ?? [];
  const instructorLines = lines.filter(({ role }) => role !== "ta");
  const taLines = lines.filter(({ role }) => role === "ta");
  const assistantNames = assistantNamesOf(section, taLines);
  const isUnstaffed = instructorLines.some(({ role }) => role === "unstaffedSection");

  return {
    sectionId: section.id,
    courseLabel: courseLabelOf(section),
    component: section.component,
    title: section.title,
    meetingSummary: meetingSummaryOf(section),
    enrollmentCap: section.enrollmentCap,
    history,
    isCancelled: section.isCancelled,
    isUnstaffed,
    instructorName: instructorNameOf(section, isUnstaffed, taLines.length > 0),
    instructorBasisLabel: instructorLines[0]
      ? describeCostBasis(instructorLines[0].basis, labelOfSection)
      : "",
    instructorCost: sumOrNull(instructorLines),
    hasInstructorOverride: instructorLines.some(
      ({ basis }) => basis.kind === "override",
    ),
    assistantNames,
    taBasisLabel: taBasisLabelOf(taLines, labelOfSection),
    taCostCell: taCostCellOf(taLines, labelOfSection),
    notes: section.notes,
  };
}

function meetingSummaryOf(section: PlannedSection): string {
  const [first] = section.meetings;
  if (!first) return "Async";

  const time = formatTimeRange(
    minutesFromClock(first.startTime),
    minutesFromClock(first.endTime),
  );

  return `${daysMetLabel(section.meetings)} ${time}`;
}

function instructorNameOf(
  section: PlannedSection,
  isUnstaffed: boolean,
  hasAssistants: boolean,
): string {
  if (isUnstaffed) return "TBA";

  const leads = instructorsOfRecord(section.instructors);
  if (leads.length === 0) return hasAssistants ? "Taught by TA" : "—";

  return leads.map(({ name, lastName }) => name ?? lastName ?? "Unknown").join(", ");
}

function assistantNamesOf(section: PlannedSection, taLines: CostLine[]): string {
  const percentOf = (emplid: number) => {
    const basis = taLines.find((line) => line.emplid === emplid)?.basis;
    return basis?.kind === "taAppointment" ? ` ${basis.appointmentPercent}%` : "";
  };

  return section.instructors
    .filter(({ role }) => role === TA_ROLE)
    .map(({ emplid, lastName }) => `${lastName ?? "Unknown"}${percentOf(emplid)}`)
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
    return dollars === null ? { kind: "missingRate" } : { kind: "amount", dollars };
  }

  const otherSectionBasis = taLines[0]?.basis;
  if (otherSectionBasis?.kind === "chargedOnOtherSection") {
    return {
      kind: "chargedOnOtherSection",
      sectionLabel: labelOfSection(otherSectionBasis.sectionId),
    };
  }

  return { kind: "none" };
}

function taBasisLabelOf(
  taLines: CostLine[],
  labelOfSection: (sectionId: number) => string,
): string {
  const chargedLine = taLines.find(
    ({ basis }) => basis.kind !== "chargedOnOtherSection",
  );
  if (!chargedLine) return "";

  return describeCostBasis(chargedLine.basis, labelOfSection);
}

function sumOrNull(lines: CostLine[]): number | null {
  if (lines.some(({ amount }) => amount === null)) return null;

  return lines.reduce((total, { amount }) => total + (amount ?? 0), 0);
}
