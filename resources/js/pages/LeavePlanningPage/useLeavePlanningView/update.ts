import { isEqual } from "lodash-es";
import {
  HISTORY_FACETS,
  type FilterFacet,
  type Next,
  type PlanningFilters,
  type ViewEvent,
  type ViewState,
} from "./types";
import {
  DEFAULT_VIEW,
  decodeViewQuery,
  defaultFilters,
  emptyFilters,
  encodeViewQuery,
} from "./viewQuery";

export const initialState = (): ViewState => ({
  range: { startTermId: null, endTermId: null },
  isHistoryRequested: false,
  view: DEFAULT_VIEW,
  filters: defaultFilters(),
  activeFacet: "person",
  selection: null,
});

export function update(state: ViewState, event: ViewEvent): Next {
  const nextState = reduce(state, event);

  if (event.type === "urlChanged") return { state: nextState, effects: [] };

  const query = encodeViewQuery(nextState);
  const isQueryUnchanged = isEqual(query, encodeViewQuery(state));

  return {
    state: nextState,
    effects: isQueryUnchanged ? [] : [{ type: "replaceUrlQuery", query }],
  };
}

function reduce(state: ViewState, event: ViewEvent): ViewState {
  switch (event.type) {
    case "urlChanged": {
      const urlState = decodeViewQuery(event.query);
      const stateWithUrl = { ...state, ...urlState };
      if (urlState.isHistoryRequested) return stateWithUrl;
      return withoutHistory(stateWithUrl);
    }

    case "rangeStartSelected": {
      const { endTermId } = state.range;
      const isEndBeforeStart = endTermId !== null && endTermId < event.termId;
      return {
        ...state,
        range: {
          startTermId: event.termId,
          endTermId: isEndBeforeStart ? event.termId : endTermId,
        },
      };
    }

    case "rangeEndSelected": {
      const { startTermId } = state.range;
      const isStartAfterEnd =
        startTermId !== null && startTermId > event.termId;
      return {
        ...state,
        range: {
          startTermId: isStartAfterEnd ? event.termId : startTermId,
          endTermId: event.termId,
        },
      };
    }

    case "historyToggled":
      return state.isHistoryRequested
        ? withoutHistory(state)
        : { ...state, isHistoryRequested: true };

    case "viewSelected":
      return { ...state, view: event.view };

    case "facetOpened":
      return { ...state, activeFacet: event.facet };

    case "filterValuesAdded": {
      const current = state.filters[event.facet];
      const values = [...new Set([...current, ...event.values])];
      return withFacet(state, event.facet, values);
    }

    case "filterValuesRemoved":
      return withFacet(
        state,
        event.facet,
        state.filters[event.facet].filter(
          (value) => !event.values.includes(value),
        ),
      );

    case "filtersCleared": {
      const filters = state.isHistoryRequested
        ? emptyFilters()
        : defaultFilters();
      return { ...state, filters };
    }

    case "leaveSelected":
      return { ...state, selection: { kind: "leave", leaveId: event.leaveId } };

    case "sectionSelected":
      return {
        ...state,
        selection: { kind: "section", sectionKey: event.sectionKey },
      };

    case "deselected":
      return { ...state, selection: null };
  }
}

function withFacet(
  state: ViewState,
  facet: FilterFacet,
  values: string[],
): ViewState {
  const filters: PlanningFilters = { ...state.filters, [facet]: values };
  return { ...state, filters };
}

function withoutHistory(state: ViewState): ViewState {
  const filters = { ...state.filters };
  for (const facet of HISTORY_FACETS) filters[facet] = defaultFilters()[facet];

  const isSectionSelected = state.selection?.kind === "section";
  const isSectionFacetOpen = HISTORY_FACETS.includes(state.activeFacet);

  return {
    ...state,
    isHistoryRequested: false,
    filters,
    selection: isSectionSelected ? null : state.selection,
    activeFacet: isSectionFacetOpen ? "person" : state.activeFacet,
  };
}
