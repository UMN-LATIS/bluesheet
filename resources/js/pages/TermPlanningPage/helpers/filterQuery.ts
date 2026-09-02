/** Filters as URL query: one key per facet, values comma-joined. */

import type { LocationQuery, LocationQueryValue } from "vue-router";
import { FILTER_FACETS, type ScheduleFilters } from "../types";
import { emptyFilters } from "../useScheduleEditor/update";

export function encodeFilters(filters: ScheduleFilters): LocationQuery {
  const query: LocationQuery = {};

  for (const facet of FILTER_FACETS) {
    if (filters[facet].length > 0) {
      query[facet] = filters[facet].join(",");
    }
  }

  return query;
}

export function decodeFilters(query: LocationQuery): ScheduleFilters {
  const filters = emptyFilters();

  for (const facet of FILTER_FACETS) {
    if (facet in query) {
      filters[facet] = dedupe(valuesOf(query[facet]));
    }
  }

  return filters;
}

function valuesOf(
  raw: LocationQueryValue | LocationQueryValue[] | undefined,
): string[] {
  const rawValues = Array.isArray(raw) ? raw : [raw];

  return rawValues
    .flatMap((value) => (value ?? "").split(","))
    .filter((value) => value !== "");
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}
