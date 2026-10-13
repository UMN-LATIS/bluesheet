import type { CostAssumptions } from "@/types";
import type { PlannedSection, SisInstructor } from "../types";
import { describeCostBasis } from "./costBasis";
import type { RateOverrides } from "./costOverrides";
import type { EnrollmentPoint } from "./enrollmentHistory";
import { daysMetLabel } from "./scheduleDays";
import { instructorsOfRecord, TA_ROLE } from "./sectionPeople";
import {
  pricingByEmplidOf,
  type CostLine,
  type SectionCost,
} from "./termEstimate";
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
  reason: string | null;
  isOverridden: boolean;
  /**
   * The lecture this line is paid on. Null when the line is
   * paid on its own section.
   */
  paidOnLectureLabel: string | null;
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
  /**
   * The job code and title of each instructor of record,
   * or how the cost was reached when there is none.
   */
  instructorSubline: string;
  /**
   * How the instructor cost was reached. Empty when nothing
   * was costed.
   */
  instructorBasisLabel: string;
  /** Null when a line has no rate. */
  instructorCost: number | null;
  hasInstructorOverride: boolean;
  /**
   * The lecture this section's instructor cost is paid on.
   * Null when the section is paid on its own section.
   */
  paidOnLectureLabel: string | null;
  /**
   * Empty when nothing on the section can be overridden.
   */
  instructorLines: OverridableLine[];
  assistantNames: string;
  /**
   * How the TA cost was reached. Empty when no TA is
   * charged on this section.
   */
  taBasisLabel: string;
  taCostCell: TaCostCell;
  hasTaOverride: boolean;
  /** Empty when no TA is charged on this section. */
  taLines: OverridableLine[];
  notes: string;
}

export const courseLabelOf = (section: PlannedSection) =>
  `${section.subject} ${section.catalogNumber}-${section.section}`;

/**
 * "9401 · Professor". The title is the admin's for the job
 * code, else the one on the person's appointment.
 */
export function jobLabelsOf(
  assumptions: CostAssumptions,
  rateOverrides: RateOverrides,
): (emplid: number) => string {
  const pricingOfEmplid = pricingByEmplidOf(assumptions, rateOverrides);
  const positionTitlesByEmplid = new Map(
    assumptions.people.map((person) => [person.emplid, person.positionTitles]),
  );

  return (emplid) => {
    const { jobCode, rate } = pricingOfEmplid(emplid);
    if (jobCode === null) return "No job code in this department";

    const title = rate?.title ?? positionTitlesByEmplid.get(emplid)?.[jobCode];
    return title ? `${jobCode} · ${title}` : jobCode;
  };
}

export function budgetRowOf(
  section: PlannedSection,
  cost: SectionCost | undefined,
  history: EnrollmentPoint[],
  labelOfSection: (sectionId: number) => string,
  jobLabelOfEmplid: (emplid: number) => string,
): BudgetRow {
  const lines = cost?.lines ?? [];
  const instructorLines = lines.filter(({ role }) => role !== "ta");
  const taLines = lines.filter(({ role }) => role === "ta");
  const assistantNames = assistantNamesOf(section, taLines);
  const isUnstaffed = instructorLines.some(
    ({ role }) => role === "unstaffedSection",
  );
  const leads = instructorsOfRecord(section.instructors);
  const instructorBasisLabel = instructorLines[0]
    ? describeCostBasis(instructorLines[0].basis, labelOfSection)
    : "";
  const leadJobLabels = [
    ...new Set(leads.map(({ emplid }) => jobLabelOfEmplid(emplid))),
  ];

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
    instructorName: instructorNameOf(leads, isUnstaffed, taLines.length > 0),
    instructorSubline:
      leadJobLabels.length > 0
        ? leadJobLabels.join(", ")
        : instructorBasisLabel,
    instructorBasisLabel,
    instructorCost: sumOrNull(instructorLines),
    hasInstructorOverride: instructorLines.some(isOverriddenLine),
    paidOnLectureLabel: paidOnLectureLabelOf(instructorLines, labelOfSection),
    instructorLines: overridableLinesOf(
      section,
      instructorLines.filter(({ role }) => role === "instructor"),
      labelOfSection,
    ),
    assistantNames,
    taBasisLabel: taBasisLabelOf(taLines, labelOfSection),
    taCostCell: taCostCellOf(taLines, labelOfSection),
    hasTaOverride: taLines.some(isOverriddenLine),
    taLines: overridableLinesOf(section, taLines, labelOfSection),
    notes: section.notes,
  };
}

const isOverriddenLine = ({ basis }: CostLine) => basis.kind === "lineOverride";

function paidOnLectureLabelOf(
  instructorLines: CostLine[],
  labelOfSection: (sectionId: number) => string,
): string | null {
  const [first] = instructorLines;
  if (first?.basis.kind !== "paidOnLecture") return null;
  if (!instructorLines.every(({ basis }) => basis.kind === "paidOnLecture")) {
    return null;
  }

  return labelOfSection(first.basis.lectureSectionId);
}

function overridableLinesOf(
  section: PlannedSection,
  lines: CostLine[],
  labelOfSection: (sectionId: number) => string,
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
        reason: isOverridden ? basis.reason : null,
        isOverridden,
        paidOnLectureLabel:
          basis.kind === "paidOnLecture"
            ? labelOfSection(basis.lectureSectionId)
            : null,
      },
    ];
  });
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

function assistantNamesOf(
  section: PlannedSection,
  taLines: CostLine[],
): string {
  const percentOf = (emplid: number) => {
    const basis = taLines.find((line) => line.emplid === emplid)?.basis;
    if (basis?.kind !== "taAppointment") return "";

    const abdSuffix = basis.studentStatus === "abd" ? " ABD" : "";
    return ` ${basis.appointmentPercent}%${abdSuffix}`;
  };

  return section.instructors
    .filter(({ role }) => role === TA_ROLE)
    .map(
      ({ emplid, lastName }) => `${lastName ?? "Unknown"}${percentOf(emplid)}`,
    )
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
