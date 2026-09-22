/**
 * Binds the pure editor to Vue: named reads and methods, never the state or
 * `dispatch`.
 *
 * The reads come back as an unwrapped `reactive`, so `schedule.filters` is the
 * value rather than a ref. Destructuring one (`const { filters } = schedule`)
 * takes a copy and stops tracking, with nothing to warn you, so read through
 * the object at the point of use.
 */

import { computed, reactive, type Ref, shallowRef } from "vue";
import dayjs from "dayjs";
import type { SisSection } from "../types";
import { dayIndexOfWeekday } from "../helpers/scheduleDays";
import { sectionProblems } from "./validation";
import {
  selectActiveFilterCount,
  selectDraftSection,
  selectHasEdits,
  selectHourReturnedTo,
  selectIsCreatingSection,
  selectIsFilterPanelOpen,
  selectIsDraftDirty,
  selectIsNewSectionSelected,
  selectLocalSections,
  selectMarkedHour,
  selectMeetings,
  selectNewSectionHasCourse,
  selectOpenHour,
  selectPlaced,
  selectSelectedLeaveId,
  selectSelectedMeetingId,
  selectSelectedSectionId,
  selectWeekView,
} from "./selectors";
import { initialState, update } from "./update";
import type { EditorEvent, Effect, ScheduleContext } from "./types";

export type ScheduleEditor = ReturnType<typeof useScheduleEditor>;

export function useScheduleEditor(
  context: Readonly<Ref<ScheduleContext>>,
  runEffect: (effect: Effect) => void,
) {
  // replaced whole, never mutated. The day tab opens on today, which is a
  // clock read and so is taken here rather than inside the reducer.
  const state = shallowRef(initialState(dayIndexOfWeekday(dayjs().day())));

  const dispatch = (event: EditorEvent) => {
    const next = update(state.value, event, context.value);
    state.value = next.state;
    // In a microtask, not inline: an effect that writes the URL brings the
    // route watcher straight back with `urlChanged`, and running that inside
    // the dispatch it came from would reduce one event on top of another.
    next.effects.forEach((effect) => queueMicrotask(() => runEffect(effect)));
  };

  return reactive({
    /* The only way in: every transition is a ViewEvent. */
    dispatch,
    /* Reads: what the schedule is, and what the page has open. */
    meetings: computed(() => selectMeetings(context.value, state.value)),
    /** The term with this browser's edits on it, before the filters. */
    localSections: computed(() =>
      selectLocalSections(context.value, state.value),
    ),
    /** What the canvases draw: filtered, then laid out in lanes. */
    placed: computed(() => selectPlaced(context.value, state.value)),
    filters: computed(() => state.value.filters),
    view: computed(() => state.value.view),
    dayIndex: computed(() => state.value.dayIndex),
    /** Whether this term takes edits at all; see `ScheduleContext`. */
    isReadOnly: computed(() => context.value.isReadOnly),
    writeError: computed(() => state.value.writeError),
    isConfirmingDelete: computed(() => state.value.isConfirmingDelete),
    isFilterPanelOpen: computed(() =>
      selectIsFilterPanelOpen(context.value, state.value),
    ),
    selection: computed(() => state.value.selection),
    activeFilterCount: computed(() => selectActiveFilterCount(state.value)),

    /* The readings of `selection` each canvas marks itself by. */
    selectedSectionId: computed(() => selectSelectedSectionId(state.value)),
    selectedLeaveId: computed(() => selectSelectedLeaveId(state.value)),
    selectedMeetingId: computed(() => selectSelectedMeetingId(state.value)),
    openHour: computed(() => selectOpenHour(state.value)),
    hourReturnedTo: computed(() => selectHourReturnedTo(state.value)),
    markedHour: computed(() => selectMarkedHour(state.value)),
    isGestureInFlight: computed(
      () => state.value.interaction.status !== "idle",
    ),

    /* Reads that take an argument, so they are called rather than watched. */
    draftSection: (section: SisSection) =>
      selectDraftSection(section, state.value),
    isDraftDirty: (section: SisSection) =>
      selectIsDraftDirty(section, state.value),
    hasEdits: (sectionId: number) => selectHasEdits(sectionId, state.value),
    /** Edits this browser has made and the server has not been told about. */
    pendingEdits: computed(() => state.value.sectionEdits),
    /** A section drawn on the grid that Create has not been pressed on yet. */
    isCreatingSection: computed(() => selectIsCreatingSection(state.value)),
    /** The same section, once a course has been picked for it. */
    newSectionHasCourse: computed(() => selectNewSectionHasCourse(state.value)),
    isNewSectionSelected: computed(() =>
      selectIsNewSectionSelected(state.value),
    ),
    /** The sheet is asking whether its unsaved edits can go. */
    isDismissalPending: computed(() => state.value.pendingDismissal !== null),
    draftProblems: (section: SisSection) =>
      sectionProblems(selectDraftSection(section, state.value)),

    weekView: (dayCount: number) =>
      selectWeekView(context.value, state.value, dayCount),

    /** The import the banner is about, or null when no banner is showing. */
    lastImport: computed(() => state.value.lastImport),
  });
}
