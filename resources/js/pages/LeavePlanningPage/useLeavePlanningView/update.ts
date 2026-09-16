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
  emptyFilters,
  encodeViewQuery,
} from "./viewQuery";

export const initialState = (): ViewState => ({
  range: { startTermId: null, endTermId: null },
  isHistoryShown: false,
  view: DEFAULT_VIEW,
  filters: emptyFilters(),
  activeFacet: "person",
  selection: null,
});

export function update(state: ViewState, event: ViewEvent): Next {
  const nextState = reduce(state, event);

  // An effect here writes the URL, and the route watcher
  // answers with urlChanged again, forever.
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
      const fromUrl = decodeViewQuery(event.query);
      const withUrl = { ...state, ...fromUrl };
      return fromUrl.isHistoryShown ? withUrl : withoutHistory(withUrl);
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
      return state.isHistoryShown
        ? withoutHistory(state)
        : { ...state, isHistoryShown: true };

    case "viewSelected":
      return { ...state, view: event.view };

    case "facetOpened":
      return { ...state, activeFacet: event.facet };

    case "filterValuesAdded":
      return withFacet(state, event.facet, [
        ...new Set([...state.filters[event.facet], ...event.values]),
      ]);

    case "filterValuesRemoved":
      return withFacet(
        state,
        event.facet,
        state.filters[event.facet].filter(
          (value) => !event.values.includes(value),
        ),
      );

    case "filtersCleared":
      return { ...state, filters: emptyFilters() };

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
  for (const facet of HISTORY_FACETS) filters[facet] = [];

  return {
    ...state,
    isHistoryShown: false,
    filters,
    selection: state.selection?.kind === "section" ? null : state.selection,
    activeFacet: HISTORY_FACETS.includes(state.activeFacet)
      ? "person"
      : state.activeFacet,
  };
}
