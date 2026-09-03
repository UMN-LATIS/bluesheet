/** Filters as URL query: one key per facet, values comma-joined. */

import { FILTER_FACETS, type ScheduleFilters, type UrlQuery } from "../types";
import { emptyFilters } from "../useScheduleEditor/update";

export function encodeFilters(filters: ScheduleFilters): UrlQuery {
  const query: UrlQuery = {};

  for (const facet of FILTER_FACETS) {
    if (filters[facet].length > 0) {
      query[facet] = filters[facet].join(",");
    }
  }

  return query;
}

export function decodeFilters(query: UrlQuery): ScheduleFilters {
  const filters = emptyFilters();

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
