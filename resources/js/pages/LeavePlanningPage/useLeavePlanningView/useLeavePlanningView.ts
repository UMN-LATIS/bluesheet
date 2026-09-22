import { computed, reactive, shallowRef, type Ref } from "vue";
import {
  selectActiveFacet,
  selectActiveFacetOptions,
  selectActiveFilterCount,
  selectAppliedFilters,
  selectAxis,
  selectCourseHistory,
  selectDraft,
  selectIsDraftValid,
  selectOpenLeaveId,
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
import type { Effect, ViewContext, ViewEvent } from "./types";

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
    /* The only way in: every transition is a ViewEvent. */
    dispatch,
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
    appliedFilters: computed(() =>
      selectAppliedFilters(context.value, state.value),
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
    draft: computed(() => selectDraft(state.value)),
    openLeaveId: computed(() => selectOpenLeaveId(state.value)),
    isDraftValid: computed(() => selectIsDraftValid(state.value)),
    pendingDismissal: computed(() => state.value.pendingDismissal),
    refusal: computed(() => state.value.refusal),
    isConfirmingDelete: computed(() => state.value.isConfirmingDelete),
    isFilterPanelOpen: computed(() => state.value.isFilterPanelOpen),
  });
}
