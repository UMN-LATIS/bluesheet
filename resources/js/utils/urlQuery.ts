import type { LocationQuery } from "vue-router";

/** One value per key. A key with no value is absent. */
export type UrlQuery = Record<string, string | undefined>;

/**
 * The router's query as one value to a key. A repeated key keeps its first
 * value, and a key written with no value at all (`?day`) is dropped rather
 * than read as the empty string, which no decoder here would accept anyway.
 */
export function flattenQuery(query: LocationQuery): UrlQuery {
  const flat: UrlQuery = {};

  for (const [key, raw] of Object.entries(query)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value !== null && value !== undefined) flat[key] = value;
  }

  return flat;
}
