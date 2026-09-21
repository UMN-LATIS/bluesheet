/** What a reader picked in one facet, in the words the filter panel showed them. */
export interface AppliedFilter {
  facet: string;
  values: string[];
}

/**
 * A person reads "Olsen, Mallory", so joining values with a comma would make
 * two people look like four.
 */
const SEPARATOR = " · ";

/** Roughly what fits up the rail beside the count badge. */
const MAX_CHARACTERS = 48;

/** The filters in the reader's own words. Empty when nothing is filtered. */
export function summarizeAppliedFilters(applied: AppliedFilter[]): string {
  const values = applied.flatMap((filter) => filter.values);
  if (values.length === 0) return "";

  const shown: string[] = [];
  let width = 0;

  for (const value of values) {
    const grown =
      width === 0 ? value.length : width + SEPARATOR.length + value.length;
    if (shown.length > 0 && grown > MAX_CHARACTERS) break;

    shown.push(value);
    width = grown;
  }

  const hidden = values.length - shown.length;
  const summary = shown.join(SEPARATOR);

  return hidden > 0 ? `${summary}${SEPARATOR}+${hidden} more` : summary;
}
