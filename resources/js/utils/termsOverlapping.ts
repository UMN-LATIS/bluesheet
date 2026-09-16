interface DatedTerm {
  id: number;
  startDate: string | null;
  endDate: string | null;
}

interface DatedRange {
  /** "YYYY-MM-DD" */
  startDate: string;
  /** "YYYY-MM-DD" */
  endDate: string;
}

/** Oldest first, terms with no dates yet left out. */
export function termsOverlapping<Term extends DatedTerm>(
  terms: Term[],
  range: DatedRange,
): Term[] {
  const overlapsRange = (term: Term) =>
    term.startDate !== null &&
    term.endDate !== null &&
    term.startDate <= range.endDate &&
    term.endDate >= range.startDate;

  return terms.filter(overlapsRange).sort((a, b) => a.id - b.id);
}
