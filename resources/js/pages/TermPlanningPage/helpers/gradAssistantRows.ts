import { academicYearEndOf } from "./academicYear";
import type { PersonRow } from "./peopleRows";

const GRAD_ASSISTANT_TYPES = ["teaching_assistant", "graduate_instructor"];
const FIRST_OWED_YEAR = 1;
const LAST_OWED_YEAR = 5;

export interface GradAssistantRow extends PersonRow {
  appointmentLabel: "TA" | "Grad instructor";
  /** The academic year's end minus the year started. Null when no start year is entered. */
  fundingYear: number | null;
  /** The department owes funding in years 1 to 5. Null when the funding year is unknown. */
  isOwedSupport: boolean | null;
  isOutsideFundingWindow: boolean;
  isUnfunded: boolean;
  supportLabel: "Owed support" | "Outside window" | "—";
}

export interface GradAssistantTotals {
  studentCount: number;
  owedSupportCount: number;
  fundedCount: number;
  totalCost: number;
}

const isGradAssistant = ({ instructorType }: PersonRow) =>
  instructorType !== null && GRAD_ASSISTANT_TYPES.includes(instructorType);

function supportLabelOf(
  isOwedSupport: boolean | null,
  isOutsideFundingWindow: boolean,
): GradAssistantRow["supportLabel"] {
  if (isOwedSupport) return "Owed support";
  if (isOutsideFundingWindow) return "Outside window";

  return "—";
}

export function gradAssistantRowsOf(
  people: PersonRow[],
  termCode: number,
): GradAssistantRow[] {
  const academicYearEnd = academicYearEndOf(termCode);

  return people.filter(isGradAssistant).map((person) => {
    const fundingYear =
      person.yearStarted === null ? null : academicYearEnd - person.yearStarted;
    const isOwedSupport =
      fundingYear === null
        ? null
        : fundingYear >= FIRST_OWED_YEAR && fundingYear <= LAST_OWED_YEAR;
    const isOutsideFundingWindow =
      fundingYear !== null && fundingYear > LAST_OWED_YEAR;

    return {
      ...person,
      appointmentLabel:
        person.instructorType === "teaching_assistant"
          ? "TA"
          : "Grad instructor",
      fundingYear,
      isOwedSupport,
      isOutsideFundingWindow,
      isUnfunded:
        isOwedSupport === true && (person.appointmentPercent ?? 0) === 0,
      supportLabel: supportLabelOf(isOwedSupport, isOutsideFundingWindow),
    };
  });
}

export function gradAssistantTotalsOf(
  rows: GradAssistantRow[],
): GradAssistantTotals {
  return {
    studentCount: rows.length,
    owedSupportCount: rows.filter(({ isOwedSupport }) => isOwedSupport === true)
      .length,
    fundedCount: rows.filter(
      ({ appointmentPercent }) => (appointmentPercent ?? 0) > 0,
    ).length,
    totalCost: rows.reduce((sum, { total }) => sum + total, 0),
  };
}
