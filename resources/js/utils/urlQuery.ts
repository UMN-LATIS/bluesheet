/**
 * The one place the router's own query shape is dealt with. Everything below
 * the page reads and writes `UrlQuery`, so no decoder has to think about a key
 * arriving twice or arriving valueless.
 */

import type { LocationQuery } from "vue-router";

/**
 * A URL query as this page reads and writes it, flattened: one value to a key,
 * and a key carrying no value is simply absent. The router's own query type
 * allows an array of values per key and a null among them, so the page
 * flattens on the way in and hands back this shape on the way out.
 */
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
