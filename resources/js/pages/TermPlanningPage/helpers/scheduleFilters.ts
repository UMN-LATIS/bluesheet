/** Within a facet, checked values are OR'd; across facets, AND'd. */

import {
  type FilterFacet,
  FILTER_FACETS,
  type ScheduleFilters,
  type SisSection,
  TBA_PERSON,
} from "../types";

/** Per facet, the values the sidebar still has reason to list. */
export type ReachableFacetValues = Record<FilterFacet, Set<string>>;

export function filterSections<T extends SisSection>(
  sections: T[],
  filters: ScheduleFilters,
): T[] {
  return sections.filter((section) => matchesAllFacets(section, filters));
}

/**
 * Which values are still standing in each facet: those carried by a section
 * that passes every *other* facet. A facet is left out of its own reckoning,
 * so checking one course leaves the whole course list checkable rather than
 * collapsing it to the one course.
 */
export function reachableFacetValues(
  sections: SisSection[],
  filters: ScheduleFilters,
): ReachableFacetValues {
  const reachable = Object.fromEntries(
    FILTER_FACETS.map((facet) => [facet, new Set<string>()]),
  ) as ReachableFacetValues;

  for (const facet of FILTER_FACETS) {
    const otherFacets = { ...filters, [facet]: [] };
    for (const section of sections) {
      if (!matchesAllFacets(section, otherFacets)) continue;
      for (const value of facetValues(section, facet)) {
        reachable[facet].add(value);
      }
    }
  }

  return reachable;
}

function matchesAllFacets(
  section: SisSection,
  filters: ScheduleFilters,
): boolean {
  return FILTER_FACETS.every((facet) =>
    matchesFacet(filters[facet], facetValues(section, facet)),
  );
}

function matchesFacet(checked: string[], sectionValues: string[]): boolean {
  return (
    checked.length === 0 ||
    checked.some((value) => sectionValues.includes(value))
  );
}

/** What a section answers to in one facet: usually one value, people aside. */
function facetValues(section: SisSection, facet: FilterFacet): string[] {
  switch (facet) {
    case "course":
      return [section.courseCode];
    case "person":
      return personValues(section);
    case "section":
      return [String(section.id)];
    case "component":
      return [section.component];
  }
}

function personValues(section: SisSection): string[] {
  if (section.instructors.length === 0) return [TBA_PERSON];
  return section.instructors.map((instructor) => String(instructor.emplid));
}
