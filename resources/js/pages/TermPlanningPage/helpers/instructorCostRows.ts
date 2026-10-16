import type { InstructorType } from "@/types";
import type { PersonRow } from "./peopleRows";

export type RatePerSection =
  | { kind: "missingRate" }
  | { kind: "amount"; dollars: number; isOverridden: boolean }
  | { kind: "byAppointment" };

export interface InstructorCostRow extends PersonRow {
  typeLabel: string;
  ratePerSection: RatePerSection;
}

export interface InstructorCostGroup {
  label: string;
  rows: InstructorCostRow[];
}

const TYPE_LABELS: Record<InstructorType, string> = {
  recurring_budget_faculty: "Recurring budget faculty",
  recurring_budget_pa: "Recurring budget P&A",
  contract_visiting: "Contract/Visiting",
  pa_instructor: "P&A Instructor",
  graduate_instructor: "Graduate Instructor",
  teaching_assistant: "TA support",
};

function typeLabelOf({ emplid, instructorType }: PersonRow): string {
  if (emplid === null) return "Unstaffed";
  if (instructorType === null) return "No job code";

  return TYPE_LABELS[instructorType];
}

function ratePerSectionOf(person: PersonRow): RatePerSection {
  if (person.isGrad) return { kind: "byAppointment" };

  if (person.salary === null) return { kind: "missingRate" };

  return {
    kind: "amount",
    dollars: person.salary + (person.fringe ?? 0),
    isOverridden: person.isRateOverridden,
  };
}

const instructorCostRowOf = (person: PersonRow): InstructorCostRow => ({
  ...person,
  typeLabel: typeLabelOf(person),
  ratePerSection: ratePerSectionOf(person),
});

export function instructorCostGroupsOf(people: PersonRow[]): {
  groups: InstructorCostGroup[];
  totalCost: number;
} {
  const rows = people
    .filter(({ isAssigned }) => isAssigned)
    .map(instructorCostRowOf);
  const groups = [
    { label: "Faculty and P&A", rows: rows.filter(({ isGrad }) => !isGrad) },
    { label: "Grad assistants", rows: rows.filter(({ isGrad }) => isGrad) },
  ].filter(({ rows: groupRows }) => groupRows.length > 0);

  return {
    groups,
    totalCost: rows.reduce((sum, { total }) => sum + total, 0),
  };
}
