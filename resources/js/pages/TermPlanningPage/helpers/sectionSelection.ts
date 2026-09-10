import { facetValues } from "./scheduleFilters";
import { FILTER_FACETS, type FilterFacet, type SisSection } from "../types";

/** Keyed `facet:value`, e.g. "course:ANTH-1001" or "person:tba". */
export type SectionsByFacetValue = Map<string, number[]>;

export function sectionsByFacetValue(
  sections: SisSection[],
): SectionsByFacetValue {
  const byValue: SectionsByFacetValue = new Map();

  for (const section of sections) {
    for (const facet of FILTER_FACETS) {
      for (const value of facetValues(section, facet)) {
        const key = `${facet}:${value}`;
        byValue.set(key, [...(byValue.get(key) ?? []), section.id]);
      }
    }
  }

  return byValue;
}

export function sectionIdsUnder(
  byValue: SectionsByFacetValue,
  facet: FilterFacet,
  values: string[],
): number[] {
  return [
    ...new Set(values.flatMap((value) => byValue.get(`${facet}:${value}`) ?? [])),
  ];
}

export type SelectionState = "all" | "some" | "none";

/** "none" when the value stands for no sections at all. */
export function selectionStateOf(
  byValue: SectionsByFacetValue,
  selected: ReadonlySet<number>,
  facet: FilterFacet,
  values: string[],
): SelectionState {
  const ids = sectionIdsUnder(byValue, facet, values);
  if (ids.length === 0) return "none";

  const chosen = ids.filter((id) => selected.has(id)).length;
  if (chosen === 0) return "none";

  return chosen === ids.length ? "all" : "some";
}

export function withSectionsSelected(
  selected: ReadonlySet<number>,
  ids: number[],
  isNowSelected: boolean,
): Set<number> {
  const next = new Set(selected);

  for (const id of ids) {
    if (isNowSelected) next.add(id);
    else next.delete(id);
  }

  return next;
}

export function valuesWithAnySelection(
  byValue: SectionsByFacetValue,
  selected: ReadonlySet<number>,
  facet: FilterFacet,
): { count: number; total: number } {
  const values = [...byValue.keys()]
    .filter((key) => key.startsWith(`${facet}:`))
    .map((key) => key.slice(facet.length + 1));

  return {
    count: values.filter(
      (value) =>
        selectionStateOf(byValue, selected, facet, [value]) !== "none",
    ).length,
    total: values.length,
  };
}
