import type { UrlQuery } from "@/utils/urlQuery";
import {
  FILTER_FACETS,
  TEACHING_VIEWS,
  type PlanningFilters,
  type Selection,
  type TeachingView,
  type ViewState,
} from "./types";

export const DEFAULT_VIEW: TeachingView = "instructors";

export const OWNED_QUERY_KEYS = [
  "start",
  "end",
  "history",
  "view",
  "leaveId",
  "section",
  ...FILTER_FACETS,
];

export const emptyFilters = (): PlanningFilters => ({
  person: [],
  course: [],
  component: [],
  category: [],
  leaveType: [],
  status: [],
});

const positiveIntegerOf = (value: string | undefined): number | null => {
  if (value === undefined || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
};

const listOf = (value: string | undefined): string[] => {
  if (value === undefined) return [];
  const items = value.split(",").filter((item) => item !== "");
  return [...new Set(items)];
};

const viewOf = (value: string | undefined): TeachingView =>
  TEACHING_VIEWS.find((view) => view === value) ?? DEFAULT_VIEW;

const selectionOf = (query: UrlQuery): Selection | null => {
  const leaveId = positiveIntegerOf(query.leaveId);
  if (leaveId !== null) return { kind: "leave", leaveId };
  if (query.section) return { kind: "section", sectionKey: query.section };
  return null;
};

type UrlBackedState = Omit<ViewState, "activeFacet">;

export function decodeViewQuery(query: UrlQuery): UrlBackedState {
  const filters = emptyFilters();
  for (const facet of FILTER_FACETS) filters[facet] = listOf(query[facet]);

  return {
    range: {
      startTermId: positiveIntegerOf(query.start),
      endTermId: positiveIntegerOf(query.end),
    },
    isHistoryShown: query.history === "1",
    view: viewOf(query.view),
    filters,
    selection: selectionOf(query),
  };
}

export function encodeViewQuery(state: UrlBackedState): UrlQuery {
  const query: UrlQuery = {};

  if (state.range.startTermId !== null) {
    query.start = String(state.range.startTermId);
  }
  if (state.range.endTermId !== null) {
    query.end = String(state.range.endTermId);
  }
  if (state.isHistoryShown) query.history = "1";
  if (state.view !== DEFAULT_VIEW) query.view = state.view;

  for (const facet of FILTER_FACETS) {
    if (state.filters[facet].length > 0) {
      query[facet] = state.filters[facet].join(",");
    }
  }

  if (state.selection?.kind === "leave") {
    query.leaveId = String(state.selection.leaveId);
  }
  if (state.selection?.kind === "section") {
    query.section = state.selection.sectionKey;
  }

  return query;
}
