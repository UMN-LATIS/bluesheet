import type { LeaveTimeline, PlanningTerm, TeachingHistory } from "@/types";
import type { UrlQuery } from "@/utils/urlQuery";

export const TEACHING_VIEWS = ["instructors", "tas", "courses"] as const;
export type TeachingView = (typeof TEACHING_VIEWS)[number];

export const FILTER_FACETS = [
  "person",
  "course",
  "component",
  "category",
  "leaveType",
  "status",
] as const;
export type FilterFacet = (typeof FILTER_FACETS)[number];

export const HISTORY_FACETS: readonly FilterFacet[] = ["course", "component"];

/** An empty facet narrows nothing. */
export type PlanningFilters = Record<FilterFacet, string[]>;

export type Selection =
  | { kind: "leave"; leaveId: number }
  | { kind: "section"; sectionKey: string };

/**
 * `startTermId` or `endTermId` left null is chosen by the
 * server from the department's leaves.
 */
export interface RequestedRange {
  startTermId: number | null;
  endTermId: number | null;
}

export interface ViewState {
  range: RequestedRange;
  isHistoryShown: boolean;
  view: TeachingView;
  filters: PlanningFilters;
  activeFacet: FilterFacet;
  selection: Selection | null;
}

export interface ViewContext {
  timeline: LeaveTimeline | null;
  teachingHistory: TeachingHistory | null;
  terms: PlanningTerm[];
  canShowHistory: boolean;
}

export type ViewEvent =
  | { type: "urlChanged"; query: UrlQuery }
  | { type: "rangeStartSelected"; termId: number }
  | { type: "rangeEndSelected"; termId: number }
  | { type: "historyToggled" }
  | { type: "viewSelected"; view: TeachingView }
  | { type: "facetOpened"; facet: FilterFacet }
  | { type: "filterValuesAdded"; facet: FilterFacet; values: string[] }
  | { type: "filterValuesRemoved"; facet: FilterFacet; values: string[] }
  | { type: "filtersCleared" }
  | { type: "leaveSelected"; leaveId: number }
  | { type: "sectionSelected"; sectionKey: string }
  | { type: "deselected" };

export type Effect = { type: "replaceUrlQuery"; query: UrlQuery };

export interface Next {
  state: ViewState;
  effects: Effect[];
}
