import { computed, reactive, shallowRef, type Ref } from "vue";
import type { UrlQuery } from "@/utils/urlQuery";
import {
  selectActiveFacet,
  selectActiveFacetOptions,
  selectActiveFilterCount,
  selectAxis,
  selectCourseHistory,
  selectFacetTiles,
  selectIsHistoryShown,
  selectLeaveRows,
  selectPeopleByEmplid,
  selectPersonHistoryRows,
  selectPlannableTermIds,
  selectPlannedTermIds,
  selectRowCounts,
  selectSelectedLeave,
  selectSelectedSection,
  selectTimelineRange,
} from "./selectors";
import { initialState, update } from "./update";
import type {
  Effect,
  FilterFacet,
  TeachingView,
  ViewContext,
  ViewEvent,
} from "./types";

export type LeavePlanningView = ReturnType<typeof useLeavePlanningView>;

/** Returns a `reactive`, so destructuring the result stops tracking. */
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
    isHistoryRequested: computed(() => state.value.isHistoryShown),
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
    plannedTermIds: computed(() => selectPlannedTermIds(context.value)),
    plannableTermIds: computed(() =>
      selectPlannableTermIds(context.value, state.value),
    ),
    peopleByEmplid: computed(() => selectPeopleByEmplid(context.value)),
    selection: computed(() => state.value.selection),
    selectedLeave: computed(() =>
      selectSelectedLeave(context.value, state.value),
    ),
    selectedSection: computed(() =>
      selectSelectedSection(context.value, state.value),
    ),

    urlChanged: (query: UrlQuery) => dispatch({ type: "urlChanged", query }),
    selectRangeStart: (termId: number) =>
      dispatch({ type: "rangeStartSelected", termId }),
    selectRangeEnd: (termId: number) =>
      dispatch({ type: "rangeEndSelected", termId }),
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
  });
}
