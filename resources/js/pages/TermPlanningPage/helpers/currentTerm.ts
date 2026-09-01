import type { SisTerm } from "../types";

/**
 * The term the page opens on when the URL names none: the one whose dates
 * contain `today`, or between terms — winter break, most of summer — the
 * next one to start. Dates are compared as "YYYY-MM-DD" strings, which
 * order the same way the days do.
 */
export function currentTerm(terms: SisTerm[], today: string): SisTerm | null {
  const dated = terms
    .filter(
      (term): term is SisTerm & { startDate: string; endDate: string } =>
        term.startDate !== null && term.endDate !== null,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const containing = dated.find(
    (term) => term.startDate <= today && today <= term.endDate,
  );

  return containing ?? dated.find((term) => today < term.startDate) ?? null;
}
