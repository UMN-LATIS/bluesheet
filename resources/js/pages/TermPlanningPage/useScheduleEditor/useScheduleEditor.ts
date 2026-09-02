/**
 * Binds the pure editor to Vue, and is the whole of what the rest of the page
 * may touch: named reads and named methods, never the state or `dispatch`.
 * So the state's shape stays private to this directory, and a component's
 * call site says what the user did rather than how the editor stores it.
 *
 * A page owns the editor and hands it to the grid, so a toolbar, a sidebar
 * and a detail sheet can all read and change the same schedule without the
 * grid standing between them.
 *
 * The base is the server's schedule, owned by the query cache and passed in
 * as a ref. The editor state holds only what this browser changed, so a
 * refetch replaces the base without disturbing the user's edits.
 *
 * Effects run through the `runEffect` the page supplies, since the page owns
 * the router and, later, the API client. They are queued for the next
 * microtask so the state swap lands first and an effect's own dispatch
 * stacks after this one rather than nesting inside it.
 */

import { computed, reactive, type Ref, shallowRef } from "vue";
import type { FilterFacet, Meeting, ScheduleFilters } from "../types";
import { mergeSchedule } from "./mergeSchedule";
import { selectWeekView } from "./selectors";
import { initialState, update } from "./update";
import type { EditorEvent, Effect, HourSelection, MeetingEdge } from "./types";

/** Everything a component may read or call. */
export type ScheduleEditor = ReturnType<typeof useScheduleEditor>;

export function useScheduleEditor(
  base: Readonly<Ref<Meeting[]>>,
  runEffect: (effect: Effect) => void,
) {
  // Replaced whole and never mutated, so deep reactivity would be cost with
  // no payoff.
  const state = shallowRef(initialState());

  const dispatch = (event: EditorEvent) => {
    const next = update(state.value, event, base.value, {
      createUuid: () => crypto.randomUUID(),
    });
    state.value = next.state;
    next.effects.forEach((effect) => queueMicrotask(() => runEffect(effect)));
  };

  // Reactive rather than a bag of refs, so no call site writes `.value` and
  // a template reads the editor as plainly as a component's own state.
  return reactive({
    /** The schedule as the user sees it: the base with this browser's edits over it. */
    meetings: computed(() => mergeSchedule(base.value, state.value)),
    filters: computed(() => state.value.filters),
    selection: computed(() => state.value.selection),
    /** Whether a gesture is under way, which is when a pointer move means something. */
    isGestureInFlight: computed(
      () => state.value.interaction.status !== "idle",
    ),
    /** Everything the week grid's columns draw, one entry per day. */
    weekView: (dayCount: number) =>
      selectWeekView(base.value, state.value, dayCount),

    pressEmptySpace: (dayIndex: number, minute: number) =>
      dispatch({ type: "pressedEmptySpace", dayIndex, minute }),
    pressMeeting: (meetingId: string, minute: number) =>
      dispatch({ type: "pressedMeeting", meetingId, minute }),
    pressMeetingEdge: (meetingId: string, edge: MeetingEdge, minute: number) =>
      dispatch({ type: "pressedMeetingEdge", meetingId, edge, minute }),
    movePointer: (dayIndex: number, minute: number) =>
      dispatch({ type: "pointerMoved", dayIndex, minute }),
    release: () => dispatch({ type: "released" }),
    /** Escape. Mid-gesture this discards the gesture. At rest it clears the selection. */
    cancel: () => dispatch({ type: "cancelled" }),
    deselect: () => dispatch({ type: "deselected" }),
    selectSection: (sectionId: number, from?: HourSelection) =>
      dispatch({
        type: "selectedSection",
        sectionId,
        ...(from ? { from } : {}),
      }),
    selectHour: (dayIndex: number, startMinute: number) =>
      dispatch({ type: "selectedHour", dayIndex, startMinute }),
    addFilterValues: (facet: FilterFacet, values: string[]) =>
      dispatch({ type: "filterValuesAdded", facet, values }),
    removeFilterValues: (facet: FilterFacet, values: string[]) =>
      dispatch({ type: "filterValuesRemoved", facet, values }),
    clearFilters: () => dispatch({ type: "filtersCleared" }),
    /** The URL changed underneath the page: initial load, back button, pasted link. */
    replaceFilters: (filters: ScheduleFilters) =>
      dispatch({ type: "filtersReplaced", filters }),
  });
}
