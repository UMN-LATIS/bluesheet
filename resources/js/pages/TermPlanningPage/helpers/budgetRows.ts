import type {
  PlannedSection,
  SisInstructor,
  SisSectionMeeting,
} from "../types";
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

export interface OverridableLine {
  courseCode: string;
  section: string;
  emplid: number;
  name: string;
  amount: number | null;
  /**
   * The cost without the override. Null when the line has
   * no rate.
   */
  defaultAmount: number | null;
  isOverridden: boolean;
}

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
  /** Null when a line has no rate. */
  instructorCost: number | null;
  hasInstructorOverride: boolean;
  /**
   * The section this section's instructor cost is paid on.
   * Null when it is paid here, or on more than one section.
   */
  paidElsewhereLabel: string | null;
  /**
   * Empty when nothing on the section can be overridden.
   */
  instructorLines: OverridableLine[];
  assistantNames: string;
  taCostCell: TaCostCell;
  hasTaOverride: boolean;
  /** Empty when no TA is charged on this section. */
  taLines: OverridableLine[];
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
    enrollmentCap: section.enrollmentCap,
    history,
    isCancelled: section.isCancelled,
    isUnstaffed,
    instructorName: instructorNameOf(leads, isUnstaffed, taLines.length > 0),
    instructorCost: sumOrNull(instructorLines),
    hasInstructorOverride: instructorLines.some(isOverriddenLine),
    paidElsewhereLabel: paidElsewhereLabelOf(instructorLines, labelOfSection),
    instructorLines: overridableLinesOf(
      section,
      instructorLines.filter(({ role }) => role === "instructor"),
    ),
    assistantNames,
    taCostCell: taCostCellOf(taLines, labelOfSection),
    hasTaOverride: taLines.some(isOverriddenLine),
    taLines: overridableLinesOf(section, taLines),
    notes: section.notes,
  };
}

const isOverriddenLine = ({ basis }: CostLine) => basis.kind === "lineOverride";

function paidSectionIdOf({ basis }: CostLine): number | null {
  if (basis.kind === "paidOnLecture") return basis.lectureSectionId;
  if (basis.kind === "chargedOnOtherSection") return basis.sectionId;

  return null;
}

function paidElsewhereLabelOf(
  instructorLines: CostLine[],
  labelOfSection: (sectionId: number) => string,
): string | null {
  const paidSectionIds = new Set(instructorLines.map(paidSectionIdOf));
  const [onlyPaidSectionId] = paidSectionIds;
  if (paidSectionIds.size !== 1 || onlyPaidSectionId == null) return null;

  return labelOfSection(onlyPaidSectionId);
}

function overridableLinesOf(
  section: PlannedSection,
  lines: CostLine[],
): OverridableLine[] {
  return lines.flatMap(({ emplid, amount, basis }) => {
    if (emplid === null || basis.kind === "chargedOnOtherSection") return [];

    const person = section.instructors.find(
      (instructor) => instructor.emplid === emplid,
    );
    const isOverridden = basis.kind === "lineOverride";

    return [
      {
        courseCode: section.courseCode,
        section: section.section,
        emplid,
        name: person?.name ?? person?.lastName ?? "Unknown",
        amount,
        defaultAmount: isOverridden ? basis.replacedAmount : amount,
        isOverridden,
      },
    ];
  });
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
    };
  }

  return { kind: "none" };
}

function sumOrNull(lines: CostLine[]): number | null {
  if (lines.some(({ amount }) => amount === null)) return null;

  return lines.reduce((total, { amount }) => total + (amount ?? 0), 0);
}
