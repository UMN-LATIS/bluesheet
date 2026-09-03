/** Filters as URL query: one key per facet, values comma-joined. */

import { FILTER_FACETS, type ScheduleFilters, type UrlQuery } from "../types";
import { emptyFilters } from "../useScheduleEditor/update";

/**
 * The meeting types the page opens on. A term is planned around its lectures,
 * and the discussions, labs and field work that hang off them treble the
 * blocks on a week without adding a decision; a scheduler asks for those by
 * checking their types under Types in the filters panel.
 */
export const DEFAULT_COMPONENTS = ["LEC"];

/** What no URL at all means: every course and person, lectures only. */
export const defaultFilters = (): ScheduleFilters => ({
  ...emptyFilters(),
  component: [...DEFAULT_COMPONENTS],
});

export function encodeFilters(filters: ScheduleFilters): UrlQuery {
  const query: UrlQuery = {};

  for (const facet of FILTER_FACETS) {
    // `component` writes even when nothing is checked, because an absent key
    // reads back as the default above and "every type" needs a way to say so.
    if (filters[facet].length > 0 || facet === "component") {
      query[facet] = filters[facet].join(",");
    }
  }

  return query;
}

export function decodeFilters(query: UrlQuery): ScheduleFilters {
  const filters = defaultFilters();

  for (const facet of FILTER_FACETS) {
    const raw = query[facet];
    if (raw !== undefined) {
      filters[facet] = dedupe(raw.split(",").filter((value) => value !== ""));
    }
  }

  return filters;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}
