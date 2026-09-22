import { isEqual } from "lodash-es";
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

export const DEFAULT_COMPONENTS = ["LEC"];

export const defaultFilters = (): PlanningFilters => ({
  ...emptyFilters(),
  component: [...DEFAULT_COMPONENTS],
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

/**
 * Adding `editor` or `pendingDismissal` here puts an
 * unsaved draft in a shareable link, and opening that link
 * restores a form nobody saved.
 */
type UrlBackedState = Omit<
  ViewState,
  | "activeFacet"
  | "editor"
  | "pendingDismissal"
  | "refusal"
  | "isConfirmingDelete"
  | "filterPanelOverride"
>;

export function decodeViewQuery(query: UrlQuery): UrlBackedState {
  const filters = defaultFilters();
  for (const facet of FILTER_FACETS) {
    if (query[facet] !== undefined) filters[facet] = listOf(query[facet]);
  }

  return {
    range: {
      startTermCode: positiveIntegerOf(query.start),
      endTermCode: positiveIntegerOf(query.end),
    },
    isHistoryRequested: query.history === "1",
    view: viewOf(query.view),
    filters,
    selection: selectionOf(query),
  };
}

export function encodeViewQuery(state: UrlBackedState): UrlQuery {
  const query: UrlQuery = {};

  if (state.range.startTermCode !== null) {
    query.start = String(state.range.startTermCode);
  }
  if (state.range.endTermCode !== null) {
    query.end = String(state.range.endTermCode);
  }
  if (state.isHistoryRequested) query.history = "1";
  if (state.view !== DEFAULT_VIEW) query.view = state.view;

  for (const facet of FILTER_FACETS) {
    if (facet === "component") continue;
    if (state.filters[facet].length > 0) {
      query[facet] = state.filters[facet].join(",");
    }
  }

  const { component } = state.filters;
  const isDefaultComponents = isEqual(component, DEFAULT_COMPONENTS);
  if (state.isHistoryRequested && !isDefaultComponents) {
    query.component = component.join(",");
  }

  if (state.selection?.kind === "leave") {
    query.leaveId = String(state.selection.leaveId);
  }
  if (state.selection?.kind === "section") {
    query.section = state.selection.sectionKey;
  }

  return query;
}
