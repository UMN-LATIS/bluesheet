import type { InstructorType } from "@/types";
import type { PersonRow } from "./peopleRows";
import { hasEmplid, type PersonWithEmplid } from "./personWithEmplid";
import { sumOf } from "./sumOf";

export interface PaContractRow extends PersonWithEmplid {
  typeLabel: string;
}

export interface PaContractTotals {
  count: number;
  load: number;
  cost: number;
}

const TYPE_LABELS: Partial<Record<InstructorType, string>> = {
  pa_instructor: "P&A instructor",
  contract_visiting: "Contract/Visiting",
  recurring_budget_pa: "Recurring P&A",
};

const NO_JOB_CODE_LABEL = "No job code";

function typeLabelOf({ instructorType }: PersonRow): string | null {
  if (instructorType === null) return NO_JOB_CODE_LABEL;

  return TYPE_LABELS[instructorType] ?? null;
}

function paContractRowsAmong(people: PersonWithEmplid[]): PaContractRow[] {
  return people.flatMap((person) => {
    const typeLabel = typeLabelOf(person);
    if (person.isGrad || typeLabel === null) return [];

    return [{ ...person, typeLabel }];
  });
}

export function paContractRowsOf(people: PersonRow[]): {
  rows: PaContractRow[];
  totals: PaContractTotals;
} {
  const rows = paContractRowsAmong(people.filter(hasEmplid));

  return {
    rows,
    totals: {
      count: rows.length,
      load: sumOf(rows.map(({ paidSectionCount }) => paidSectionCount)),
      cost: sumOf(rows.map(({ total }) => total)),
    },
  };
}
