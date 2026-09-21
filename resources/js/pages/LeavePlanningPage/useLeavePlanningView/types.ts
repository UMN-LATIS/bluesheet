import type {
  LeaveStatus,
  LeaveTimeline,
  LeaveType,
  PlanningTerm,
  TeachingHistory,
} from "@/types";
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
 * Complete, never sparse. Making these optional to mean
 * "unchanged" sends undefined to an endpoint that requires
 * all five, and the save fails validation.
 */
export interface LeaveDraft {
  /** Null until the person is picked, when creating from the toolbar. */
  emplid: number | null;
  description: string;
  type: LeaveType;
  status: LeaveStatus;
  /** "YYYY-MM-DD" */
  startDate: string;
  /** "YYYY-MM-DD" */
  endDate: string;
}

/**
 * Non-null exactly when the panel is in edit mode.
 * `draft` differing from `opened` is what unsaved means.
 */
export type Editor =
  | { kind: "editing"; leaveId: number; draft: LeaveDraft; opened: LeaveDraft }
  | { kind: "creating"; draft: LeaveDraft; opened: LeaveDraft };

/**
 * A null `startTermCode` becomes a year before the current
 * term, a null `endTermCode` a year after it.
 */
export interface RequestedRange {
  startTermCode: number | null;
  endTermCode: number | null;
}

export interface ViewState {
  range: RequestedRange;
  isHistoryRequested: boolean;
  view: TeachingView;
  filters: PlanningFilters;
  activeFacet: FilterFacet;
  selection: Selection | null;
  editor: Editor | null;
  /**
   * The event held back because running it would drop an
   * unsaved draft. Released by `dismissalConfirmed` or
   * `dismissalCancelled`.
   */
  pendingDismissal: ViewEvent | null;
}

export interface ViewContext {
  timeline: LeaveTimeline | null;
  teachingHistory: TeachingHistory | null;
  terms: PlanningTerm[];
  canViewCourses: boolean;
  canPlanTerms: boolean;
}

export type ViewEvent =
  | { type: "urlChanged"; query: UrlQuery }
  | { type: "rangeStartSelected"; termCode: number }
  | { type: "rangeEndSelected"; termCode: number }
  | { type: "historyToggled" }
  | { type: "viewSelected"; view: TeachingView }
  | { type: "facetOpened"; facet: FilterFacet }
  | { type: "filterValuesAdded"; facet: FilterFacet; values: string[] }
  | { type: "filterValuesRemoved"; facet: FilterFacet; values: string[] }
  | { type: "filtersCleared" }
  | { type: "leaveSelected"; leaveId: number }
  | { type: "sectionSelected"; sectionKey: string }
  | { type: "deselected" }
  | { type: "editRequested"; draft: LeaveDraft }
  | {
      type: "creationRequested";
      emplid: number | null;
      startDate: string;
      endDate: string;
    }
  | { type: "draftEdited"; change: Partial<LeaveDraft> }
  | { type: "draftCancelled" }
  /** The server has the leave now, under this id. */
  | { type: "leavePersisted"; leaveId: number }
  | { type: "leaveDeleted" }
  /** The reader let the held event through, losing the draft. */
  | { type: "dismissalConfirmed" }
  /** The reader kept the draft, so the held event never happened. */
  | { type: "dismissalCancelled" };

export type Effect = { type: "replaceUrlQuery"; query: UrlQuery };

export interface Next {
  state: ViewState;
  effects: Effect[];
}
