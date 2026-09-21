import { computed, reactive, shallowRef, type Ref } from "vue";
import type { UrlQuery } from "@/utils/urlQuery";
import {
  selectActiveFacet,
  selectActiveFacetOptions,
  selectActiveFilterCount,
  selectAxis,
  selectCourseHistory,
  selectDraft,
  selectIsDraftUnsaved,
  selectIsDraftValid,
  selectOpenLeaveId,
  selectPanelMode,
  selectFacetTiles,
  selectIsHistoryShown,
  selectLeaveRows,
  selectPeopleByEmplid,
  selectPersonHistoryRows,
  selectPlannableTermCodes,
  selectPlannedTermCodes,
  selectRowCounts,
  selectSelectedLeave,
  selectSelectedSection,
  selectTimelineRange,
} from "./selectors";
import { initialState, update } from "./update";
import type {
  Effect,
  FilterFacet,
  LeaveDraft,
  TeachingView,
  ViewContext,
  ViewEvent,
} from "./types";

export type LeavePlanningView = ReturnType<typeof useLeavePlanningView>;

/**
 * Returns a `reactive`, so destructuring the result stops
 * tracking.
 */
export function useLeavePlanningView(
  context: Readonly<Ref<ViewContext>>,
  runEffect: (effect: Effect) => void,
) {
  const state = shallowRef(initialState());

  const dispatch = (event: ViewEvent) => {
    const next = update(state.value, event);
    state.value = next.state;
    next.effects.forEach((effect) => queueMicrotask(() => runEffect(effect)));
  };

  return reactive({
    requestedRange: computed(() => state.value.range),
    timelineRange: computed(() => selectTimelineRange(context.value)),
    axis: computed(() => selectAxis(context.value)),
    isHistoryRequested: computed(() => state.value.isHistoryRequested),
    isHistoryShown: computed(() =>
      selectIsHistoryShown(context.value, state.value),
    ),
    view: computed(() => state.value.view),
    filters: computed(() => state.value.filters),
    activeFacet: computed(() => selectActiveFacet(context.value, state.value)),
    facetTiles: computed(() => selectFacetTiles(context.value, state.value)),
    activeFacetOptions: computed(() =>
      selectActiveFacetOptions(context.value, state.value),
    ),
    activeFilterCount: computed(() =>
      selectActiveFilterCount(context.value, state.value),
    ),
    leaveRows: computed(() =>
      selectLeaveRows(context.value, state.value.filters),
    ),
    personHistoryRows: computed(() =>
      selectPersonHistoryRows(context.value, state.value, state.value.filters),
    ),
    courseHistory: computed(() =>
      selectCourseHistory(context.value, state.value.filters),
    ),
    rowCounts: computed(() => selectRowCounts(context.value, state.value)),
    plannedTermCodes: computed(() => selectPlannedTermCodes(context.value)),
    plannableTermCodes: computed(() =>
      selectPlannableTermCodes(context.value, state.value),
    ),
    peopleByEmplid: computed(() => selectPeopleByEmplid(context.value)),
    selection: computed(() => state.value.selection),
    selectedLeave: computed(() =>
      selectSelectedLeave(context.value, state.value),
    ),
    selectedSection: computed(() =>
      selectSelectedSection(context.value, state.value),
    ),
    panelMode: computed(() => selectPanelMode(context.value, state.value)),
    draft: computed(() => selectDraft(state.value)),
    openLeaveId: computed(() => selectOpenLeaveId(state.value)),
    isDraftUnsaved: computed(() => selectIsDraftUnsaved(state.value)),
    isDraftValid: computed(() => selectIsDraftValid(state.value)),
    pendingDismissal: computed(() => state.value.pendingDismissal),

    urlChanged: (query: UrlQuery) => dispatch({ type: "urlChanged", query }),
    selectRangeStart: (termCode: number) =>
      dispatch({ type: "rangeStartSelected", termCode }),
    selectRangeEnd: (termCode: number) =>
      dispatch({ type: "rangeEndSelected", termCode }),
    toggleHistory: () => dispatch({ type: "historyToggled" }),
    selectView: (view: TeachingView) =>
      dispatch({ type: "viewSelected", view }),
    openFacet: (facet: FilterFacet) => dispatch({ type: "facetOpened", facet }),
    addFilterValues: (facet: FilterFacet, values: string[]) =>
      dispatch({ type: "filterValuesAdded", facet, values }),
    removeFilterValues: (facet: FilterFacet, values: string[]) =>
      dispatch({ type: "filterValuesRemoved", facet, values }),
    clearFilters: () => dispatch({ type: "filtersCleared" }),
    selectLeave: (leaveId: number) =>
      dispatch({ type: "leaveSelected", leaveId }),
    selectSection: (sectionKey: string) =>
      dispatch({ type: "sectionSelected", sectionKey }),
    deselect: () => dispatch({ type: "deselected" }),
    requestEdit: (draft: LeaveDraft) =>
      dispatch({ type: "editRequested", draft }),
    requestCreation: (
      emplid: number | null,
      startDate: string,
      endDate: string,
    ) => dispatch({ type: "creationRequested", emplid, startDate, endDate }),
    editDraft: (change: Partial<LeaveDraft>) =>
      dispatch({ type: "draftEdited", change }),
    cancelDraft: () => dispatch({ type: "draftCancelled" }),
    leavePersisted: (leaveId: number) =>
      dispatch({ type: "leavePersisted", leaveId }),
    leaveDeleted: () => dispatch({ type: "leaveDeleted" }),
    confirmDismissal: () => dispatch({ type: "dismissalConfirmed" }),
    cancelDismissal: () => dispatch({ type: "dismissalCancelled" }),
  });
}
