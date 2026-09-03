/** Which view the page is showing, and which day it is on, as URL query. */

import type { UrlQuery } from "../types";
import { DAY_TAB_CODES } from "./scheduleDays";

export const SCHEDULE_VIEWS = ["day", "week", "heatmap"] as const;

export type ScheduleView = (typeof SCHEDULE_VIEWS)[number];

/**
 * The week is the shape of a term, so it is where the page opens and what a
 * link that names no view means.
 */
export const DEFAULT_VIEW: ScheduleView = "week";

/** Every key this module owns; they are cleared and written together. */
export const VIEW_KEYS = ["view", "day"];

/** An unknown view is not an error worth showing; the page opens as usual. */
export function decodeView(query: UrlQuery): ScheduleView {
  return SCHEDULE_VIEWS.find((view) => view === query.view) ?? DEFAULT_VIEW;
}

/** Named rather than numbered, so a link survives a change to the tab order. */
export const encodeDayIndex = (dayIndex: number): string =>
  DAY_TAB_CODES[dayIndex] ?? DAY_TAB_CODES[0];

/** Null where the URL names no day, leaving the caller's own default to stand. */
export function decodeDayIndex(query: UrlQuery): number | null {
  const dayIndex = DAY_TAB_CODES.findIndex((code) => code === query.day);

  return dayIndex === -1 ? null : dayIndex;
}
