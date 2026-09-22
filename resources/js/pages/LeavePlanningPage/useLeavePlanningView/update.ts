import { isEqual } from "lodash-es";
import { leaveStatuses, leaveTypes } from "@/types";
import {
  HISTORY_FACETS,
  type Editor,
  type Effect,
  type FilterFacet,
  type LeaveDraft,
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
  range: { startTermCode: null, endTermCode: null },
  isHistoryRequested: false,
  view: DEFAULT_VIEW,
  filters: defaultFilters(),
  activeFacet: "person",
  selection: null,
  editor: null,
  pendingDismissal: null,
  refusal: null,
  isConfirmingDelete: false,
  isFilterPanelOpen: false,
});

const DRAFT_DISCARDING_EVENTS: ViewEvent["type"][] = [
  "leaveSelected",
  "sectionSelected",
  "deselected",
  "creationRequested",
  "urlChanged",
];

/**
 * Events after which the panel is showing something else, so a refusal or a
 * delete question raised against what it showed before no longer applies.
 */
const PANEL_MOVED_ON: ViewEvent["type"][] = [
  "leaveSelected",
  "sectionSelected",
  "deselected",
  "editRequested",
  "creationRequested",
  "draftCancelled",
  "leavePersisted",
  "leaveDeleted",
  "urlChanged",
];

const selectionKeyOf = (state: ViewState): string | null => {
  const { selection } = state;
  if (selection === null) return null;
  return selection.kind === "leave"
    ? `leave-${selection.leaveId}`
    : `section-${selection.sectionKey}`;
};

const isUnsaved = (editor: Editor | null): boolean =>
  editor !== null && !isEqual(editor.draft, editor.openedDraft);

export const draftFor = (
  emplid: number | null,
  startDate: string,
  endDate: string,
): LeaveDraft => ({
  emplid,
  description: "",
  type: leaveTypes.SABBATICAL,
  status: leaveStatuses.PENDING,
  startDate,
  endDate,
});

export function update(state: ViewState, event: ViewEvent): Next {
  // Releasing the held event through `reduce` instead
  // skips the `replaceUrlQuery` effect, so confirming a
  // discard changes the selection without writing the URL.
  if (event.type === "dismissalConfirmed") {
    const held = state.pendingDismissal;
    if (held === null) return { state, effects: [] };
    return update({ ...state, editor: null, pendingDismissal: null }, held);
  }

  if (isUnsaved(state.editor) && DRAFT_DISCARDING_EVENTS.includes(event.type)) {
    return { state: { ...state, pendingDismissal: event }, effects: [] };
  }

  const reduced = reduce(state, event);
  const nextState = PANEL_MOVED_ON.includes(event.type)
    ? { ...reduced, refusal: null, isConfirmingDelete: false }
    : reduced;

  const effects: Effect[] = [];

  const key = selectionKeyOf(nextState);
  if (key !== null && key !== selectionKeyOf(state)) {
    effects.push({ type: "scrollToSelection", key });
  }

  if (event.type !== "urlChanged") {
    const query = encodeViewQuery(nextState);
    if (!isEqual(query, encodeViewQuery(state))) {
      effects.push({ type: "replaceUrlQuery", query });
    }
  }

  return { state: nextState, effects };
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
      const { endTermCode } = state.range;
      const isEndBeforeStart =
        endTermCode !== null && endTermCode < event.termCode;
      return {
        ...state,
        range: {
          startTermCode: event.termCode,
          endTermCode: isEndBeforeStart ? event.termCode : endTermCode,
        },
      };
    }

    case "rangeEndSelected": {
      const { startTermCode } = state.range;
      const isStartAfterEnd =
        startTermCode !== null && startTermCode > event.termCode;
      return {
        ...state,
        range: {
          startTermCode: isStartAfterEnd ? event.termCode : startTermCode,
          endTermCode: event.termCode,
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
      return {
        ...state,
        selection: { kind: "leave", leaveId: event.leaveId },
        editor: null,
      };

    case "sectionSelected":
      return {
        ...state,
        selection: { kind: "section", sectionKey: event.sectionKey },
        editor: null,
      };

    case "deselected":
      return { ...state, selection: null, editor: null };

    case "editRequested": {
      if (state.selection?.kind !== "leave") return state;
      return {
        ...state,
        editor: {
          kind: "editingLeave",
          leaveId: state.selection.leaveId,
          draft: event.draft,
          openedDraft: event.draft,
        },
      };
    }

    case "creationRequested": {
      const draft = draftFor(event.emplid, event.startDate, event.endDate);
      return {
        ...state,
        selection: null,
        editor: { kind: "creatingLeave", draft, openedDraft: draft },
      };
    }

    case "draftEdited": {
      if (state.editor === null) return state;
      const draft = { ...state.editor.draft, ...event.change };
      return { ...state, editor: { ...state.editor, draft } };
    }

    case "draftCancelled":
      return { ...state, editor: null };

    case "leavePersisted":
      return {
        ...state,
        editor: null,
        selection: { kind: "leave", leaveId: event.leaveId },
      };

    case "leaveDeleted":
      return { ...state, editor: null, selection: null };

    case "dismissalConfirmed":
      return state;

    case "dismissalCancelled":
      return { ...state, pendingDismissal: null };

    case "writeRefused":
      return { ...state, refusal: event.message };

    case "deleteRequested":
      return { ...state, isConfirmingDelete: true };

    case "deleteCancelled":
      return { ...state, isConfirmingDelete: false };

    case "filterPanelToggled":
      return { ...state, isFilterPanelOpen: !state.isFilterPanelOpen };

    case "breakpointChanged":
      return { ...state, isFilterPanelOpen: event.isWide };
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
