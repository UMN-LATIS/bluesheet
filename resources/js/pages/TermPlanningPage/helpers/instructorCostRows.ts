import type { InstructorType } from "@/types";
import type { PersonRow } from "./peopleRows";

export interface SalaryPerSection {
  amount: number | null;
  hint: string | null;
  isOverridden: boolean;
}

export type CostPerSection =
  | { kind: "missingRate" }
  | { kind: "amount"; dollars: number }
  | { kind: "appointment"; percentLabel: string; total: number };

export interface InstructorCostRow extends PersonRow {
  typeLabel: string;
  salaryPerSection: SalaryPerSection;
  costPerSection: CostPerSection;
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

const salaryPerSectionOf = (person: PersonRow): SalaryPerSection => ({
  amount: person.salary,
  hint: person.salaryHint,
  isOverridden: person.isSalaryOverridden,
});

function costPerSectionOf(person: PersonRow): CostPerSection {
  if (person.isGrad) {
    return {
      kind: "appointment",
      percentLabel: person.loadLabel,
      total: person.total,
    };
  }

  if (person.salary === null) return { kind: "missingRate" };

  return { kind: "amount", dollars: person.salary + (person.fringe ?? 0) };
}

const instructorCostRowOf = (person: PersonRow): InstructorCostRow => ({
  ...person,
  typeLabel: typeLabelOf(person),
  salaryPerSection: salaryPerSectionOf(person),
  costPerSection: costPerSectionOf(person),
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
