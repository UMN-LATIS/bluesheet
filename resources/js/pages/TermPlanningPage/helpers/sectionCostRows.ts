import { lastNameFirst } from "@/utils/lastNameFirst";
import type { PlannedSection, SisInstructor } from "../types";
import { notPaidHereReasonOf } from "./costReason";
import { formatWholeDollars } from "./money";
import type { SectionCost } from "./termEstimate";

export interface SectionCostRow {
  key: string;
  name: string;
  isTa: boolean;
  amount: number | null;
  unpaidReason: string | null;
}

export interface SectionCostDetails {
  rows: SectionCostRow[];
  summary: string;
}

export function sectionCostDetailsOf(
  section: PlannedSection,
  cost: SectionCost,
  labelOfSection: (sectionId: number) => string,
): SectionCostDetails | null {
  if (cost.lines.length === 0) return null;

  return {
    rows: sectionCostRowsOf(section, cost, labelOfSection),
    summary: costSummaryOf(cost),
  };
}

function sectionCostRowsOf(
  section: PlannedSection,
  cost: SectionCost,
  labelOfSection: (sectionId: number) => string,
): SectionCostRow[] {
  return cost.lines.map(({ role, emplid, amount, basis }, index) => {
    const person = section.instructors.find(
      (instructor) => instructor.emplid === emplid,
    );

    return {
      key: `${index}-${emplid}`,
      name: displayNameOf(emplid, person),
      isTa: role === "ta",
      amount,
      unpaidReason: notPaidHereReasonOf(basis, labelOfSection),
    };
  });
}

function displayNameOf(
  emplid: number | null,
  person: SisInstructor | undefined,
): string {
  if (emplid === null) return "TBA";
  if (person?.name) return lastNameFirst(person.name, person.lastName);

  return person?.lastName ?? "Unknown";
}

function costSummaryOf(cost: SectionCost): string {
  const hasMissingRate = cost.lines.some(({ amount }) => amount === null);
  return hasMissingRate ? "No rate" : formatWholeDollars(cost.total);
}
