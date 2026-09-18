import type { PlanningLeave, PlanningTerm } from "@/types";

/** Oldest first, terms with no dates yet left out. */
export function termsOverlapping(
  terms: PlanningTerm[],
  range: Pick<PlanningLeave, "startDate" | "endDate">,
): PlanningTerm[] {
  const overlapsRange = (term: PlanningTerm) =>
    term.startDate !== null &&
    term.endDate !== null &&
    term.startDate <= range.endDate &&
    term.endDate >= range.startDate;

  return terms.filter(overlapsRange).sort((a, b) => a.id - b.id);
}
