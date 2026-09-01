/**
 * The URL form of the schedule filters: one query key per facet, the
 * checked values joined by commas. Keeps the filters shareable in a link
 * and lets a page reload restore what was checked.
 */

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

/** One query key's raw value, split into its comma-separated, non-empty parts. */
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
