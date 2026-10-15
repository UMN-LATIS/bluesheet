import type { InstructorType } from "@/types";
import { loadMismatchLabelOf } from "./loadMismatch";
import type { PersonRow } from "./peopleRows";
import { hasEmplid, type PersonWithEmplid } from "./personWithEmplid";

export interface PaContractRow extends PersonWithEmplid {
  typeLabel: string;
  mismatchLabel: string | null;
}

export interface PaContractTotals {
  count: number;
  expected: number;
  listed: number;
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

const isPaOrContract = (person: PersonRow) =>
  !person.isGrad && typeLabelOf(person) !== null;

const sumOf = (amounts: (number | null)[]) =>
  amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0);

function paContractRowOf(person: PersonWithEmplid): PaContractRow {
  return {
    ...person,
    typeLabel: typeLabelOf(person) ?? NO_JOB_CODE_LABEL,
    mismatchLabel: loadMismatchLabelOf(
      person.expectedSectionCount,
      person.paidSectionCount,
    ),
  };
}

export function paContractRowsOf(people: PersonRow[]): {
  rows: PaContractRow[];
  totals: PaContractTotals;
} {
  const rows = people
    .filter(isPaOrContract)
    .filter(hasEmplid)
    .map(paContractRowOf);

  return {
    rows,
    totals: {
      count: rows.length,
      expected: sumOf(
        rows.map(({ expectedSectionCount }) => expectedSectionCount),
      ),
      listed: sumOf(rows.map(({ paidSectionCount }) => paidSectionCount)),
      cost: sumOf(rows.map(({ total }) => total)),
    },
  };
}
