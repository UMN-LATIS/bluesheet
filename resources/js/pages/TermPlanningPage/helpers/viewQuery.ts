/** Which view the page is showing, and which day it is on, as URL query. */

import type { LocationQueryValue } from "vue-router";
import { DAY_TAB_CODES } from "./scheduleDays";

export const SCHEDULE_VIEWS = ["day", "week", "heatmap"] as const;

export type ScheduleView = (typeof SCHEDULE_VIEWS)[number];

/**
 * The week is the shape of a term, so it is where the page opens and what a
 * link that names no view means.
 */
export const DEFAULT_VIEW: ScheduleView = "week";

/** An unknown view is not an error worth showing; the page opens as usual. */
export function decodeView(raw: QueryValue): ScheduleView {
  const value = single(raw);
  return SCHEDULE_VIEWS.find((view) => view === value) ?? DEFAULT_VIEW;
}

/** Named rather than numbered, so a link survives a change to the tab order. */
export const encodeDayIndex = (dayIndex: number): string =>
  DAY_TAB_CODES[dayIndex] ?? DAY_TAB_CODES[0];

/** Null where the URL names no day, leaving the caller's own default to stand. */
export function decodeDayIndex(raw: QueryValue): number | null {
  const value = single(raw);
  const dayIndex = DAY_TAB_CODES.findIndex((code) => code === value);

  return dayIndex === -1 ? null : dayIndex;
}

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined;

/** A key repeated in the query arrives as an array; the first one wins. */
const single = (raw: QueryValue): string | null =>
  (Array.isArray(raw) ? raw[0] : raw) ?? null;
