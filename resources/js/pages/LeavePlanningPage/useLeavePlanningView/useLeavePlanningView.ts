/**
 * The reads come back as an unwrapped `reactive`.
 * Destructuring one takes a copy and stops tracking, so
 * read through the object at the point of use.
 */

import { computed, reactive, shallowRef, type Ref } from "vue";
import type { UrlQuery } from "@/utils/urlQuery";
import {
  selectActiveFacet,
  selectActiveFacetOptions,
  selectActiveFilterCount,
  selectAxis,
  selectCourseView,
  selectFacetTiles,
  selectIsHistoryShown,
  selectLeaveRows,
  selectPeopleByEmplid,
  selectPersonHistoryRows,
  selectResolvedRange,
  selectSelectedLeave,
  selectSelectedSection,
  selectVisibleFacets,
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

export function useLeavePlanningView(
  context: Readonly<Ref<ViewContext>>,
  runEffect: (effect: Effect) => void,
) {
  const state = shallowRef(initialState());

  const dispatch = (event: ViewEvent) => {
    const next = update(state.value, event);
    state.value = next.state;
    // Not inline: writing the URL brings the route
    // watcher straight back with `urlChanged`, which
    // must not be reduced inside this dispatch.
    next.effects.forEach((effect) => queueMicrotask(() => runEffect(effect)));
  };

  return reactive({
    requestedRange: computed(() => state.value.range),
    resolvedRange: computed(() => selectResolvedRange(context.value)),
    axis: computed(() => selectAxis(context.value)),
    isHistoryShown: computed(() =>
      selectIsHistoryShown(context.value, state.value),
    ),
    view: computed(() => state.value.view),
    filters: computed(() => state.value.filters),
    visibleFacets: computed(() =>
      selectVisibleFacets(context.value, state.value),
    ),
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
    courseView: computed(() =>
      selectCourseView(context.value, state.value.filters),
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
    selectView: (view: TeachingView) => dispatch({ type: "viewSelected", view }),
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
