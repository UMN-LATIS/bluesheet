/**
 * Narrows the sections the grid draws to the ones the sidebar's checked
 * facets allow. Within a facet, checked values are OR'd; across facets,
 * they're AND'd, so a section passes when every non-empty facet matches at
 * least one of its checked values.
 */

import {
  FILTER_FACETS,
  type ScheduleFilters,
  type SisSection,
  TBA_PERSON,
} from "../types";

/** False when every facet is empty, so no filter is narrowing anything. */
export function isFiltering(filters: ScheduleFilters): boolean {
  return FILTER_FACETS.some((facet) => filters[facet].length > 0);
}

export function filterSections<T extends SisSection>(
  sections: T[],
  filters: ScheduleFilters,
): T[] {
  return sections.filter((section) => matchesAllFacets(section, filters));
}

function matchesAllFacets(
  section: SisSection,
  filters: ScheduleFilters,
): boolean {
  return (
    matchesFacet(filters.course, [section.courseCode]) &&
    matchesFacet(filters.person, personValues(section)) &&
    matchesFacet(filters.section, [String(section.id)]) &&
    matchesFacet(filters.component, [section.component])
  );
}

/** An empty facet narrows nothing; otherwise the section needs one match. */
function matchesFacet(checked: string[], sectionValues: string[]): boolean {
  return (
    checked.length === 0 ||
    checked.some((value) => sectionValues.includes(value))
  );
}

/** Every instructor's emplid, regardless of role; TBA_PERSON if there are none. */
function personValues(section: SisSection): string[] {
  if (section.instructors.length === 0) return [TBA_PERSON];
  return section.instructors.map((instructor) => String(instructor.emplid));
}
