import type { AppliedFilter } from "@/utils/appliedFilterSummary";
import {
  FILTER_FACETS,
  type FilterFacet,
  type ScheduleFilters,
} from "../types";
import type { FilterOptions } from "./filterOptions";

/**
 * Passing `label` straight through instead reads as two sections up the rail:
 * the summary joins values with " · " and "HIST 1082 · 001" already holds one.
 */
const withoutMiddot = (label: string) => label.replace(" · ", " ");

function labelsByValue(
  facet: FilterFacet,
  options: FilterOptions,
): Map<string, string> {
  switch (facet) {
    case "course":
      return new Map(
        options.courseLevels.flatMap(({ courses }) =>
          courses.map(({ value, code }): [string, string] => [value, code]),
        ),
      );

    case "person": {
      const listed = options.tba
        ? [options.tba, ...options.faculty]
        : options.faculty;
      return new Map(
        listed.map(({ value, listName }): [string, string] => [
          value,
          listName,
        ]),
      );
    }

    case "section":
      return new Map(
        options.sections.map(({ value, label }): [string, string] => [
          value,
          withoutMiddot(label),
        ]),
      );

    case "component":
      return new Map(
        options.components.map(({ value }): [string, string] => [value, value]),
      );
  }
}

export function appliedScheduleFilters(
  options: FilterOptions,
  filters: ScheduleFilters,
): AppliedFilter[] {
  return FILTER_FACETS.flatMap((facet) => {
    const chosenValues = filters[facet];
    if (chosenValues.length === 0) return [];

    const labels = labelsByValue(facet, options);
    return [
      { values: chosenValues.map((value) => labels.get(value) ?? value) },
    ];
  });
}
