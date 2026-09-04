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
import type { FilterFacet, SisSection, UrlQuery } from "../types";
import type { ScheduleView } from "../helpers/viewQuery";
import { dayIndexOfWeekday } from "../helpers/scheduleDays";
import { sectionProblems } from "./validation";
import type { SectionEdit } from "./types";
import type { SisDay } from "../types";
import {
  selectActiveFilterCount,
  selectDraftSection,
  selectHasEdits,
  selectHourReturnedTo,
  selectIsCreatingSection,
  selectIsDraftDirty,
  selectIsNewSectionSelected,
  selectLocalSections,
  selectMarkedHour,
  selectMeetings,
  selectOpenHour,
  selectPlaced,
  selectSelectedMeetingId,
  selectSelectedSectionId,
  selectWeekView,
} from "./selectors";
import { initialState, update } from "./update";
import type {
  EditorEvent,
  Effect,
  HourSelection,
  MeetingEdge,
  ScheduleContext,
} from "./types";

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
    selection: computed(() => state.value.selection),
    activeFilterCount: computed(() => selectActiveFilterCount(state.value)),

    /* The readings of `selection` each canvas marks itself by. */
    selectedSectionId: computed(() => selectSelectedSectionId(state.value)),
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
    isNewSectionSelected: computed(() =>
      selectIsNewSectionSelected(state.value),
    ),
    /** The sheet is asking whether its unsaved edits can go. */
    isDismissalPending: computed(() => state.value.pendingDismissal !== null),
    draftProblems: (section: SisSection) =>
      sectionProblems(selectDraftSection(section, state.value)),

    weekView: (dayCount: number) =>
      selectWeekView(context.value, state.value, dayCount),

    /* The week grid's pointer gestures, in the order one arrives. */
    pressEmptySpace: (dayIndex: number, minute: number) =>
      dispatch({ type: "pressedEmptySpace", dayIndex, minute }),
    pressMeeting: (meetingId: string, minute: number) =>
      dispatch({ type: "pressedMeeting", meetingId, minute }),
    pressMeetingEdge: (meetingId: string, edge: MeetingEdge, minute: number) =>
      dispatch({ type: "pressedMeetingEdge", meetingId, edge, minute }),
    movePointer: (dayIndex: number, minute: number) =>
      dispatch({ type: "pointerMoved", dayIndex, minute }),
    release: () => dispatch({ type: "released" }),
    /**
     * Escape. Mid-gesture this discards the
     * gesture. At rest it clears the selection.
     */
    cancel: () => dispatch({ type: "canceled" }),

    /* Opening and closing the detail sheet. */
    deselect: () => dispatch({ type: "deselected" }),
    selectSection: (sectionId: number, from?: HourSelection) =>
      dispatch({
        type: "selectedSection",
        sectionId,
        ...(from ? { from } : {}),
      }),
    selectHour: (dayIndex: number, startMinute: number) =>
      dispatch({ type: "selectedHour", dayIndex, startMinute }),
    /* Narrowing the term. */
    addFilterValues: (facet: FilterFacet, values: string[]) =>
      dispatch({ type: "filterValuesAdded", facet, values }),
    removeFilterValues: (facet: FilterFacet, values: string[]) =>
      dispatch({ type: "filterValuesRemoved", facet, values }),
    clearFilters: () => dispatch({ type: "filtersCleared" }),

    /* Which canvas, which day, and the URL that names them. */
    selectView: (view: ScheduleView) =>
      dispatch({ type: "viewSelected", view }),
    selectDay: (dayIndex: number) =>
      dispatch({ type: "daySelected", dayIndex }),
    showAsyncDay: () => dispatch({ type: "asyncDayShown" }),
    /** The URL changed: first load, the back button, or our own effect. */
    urlChanged: (query: UrlQuery) => dispatch({ type: "urlChanged", query }),

    /* Editing a section through the sheet: draft, then save. */
    editSection: (sectionId: number, change: SectionEdit) =>
      dispatch({ type: "sectionFieldEdited", sectionId, change }),
    toggleMeetingDay: (sectionId: number, patternIndex: number, day: SisDay) =>
      dispatch({ type: "meetingDayToggled", sectionId, patternIndex, day }),
    editMeetingTime: (
      sectionId: number,
      patternIndex: number,
      times: { startTime?: string; endTime?: string },
    ) =>
      dispatch({
        type: "meetingTimeEdited",
        sectionId,
        patternIndex,
        ...times,
      }),
    addMeetingPattern: (sectionId: number) =>
      dispatch({ type: "meetingPatternAdded", sectionId }),
    removeMeetingPattern: (sectionId: number, patternIndex: number) =>
      dispatch({ type: "meetingPatternRemoved", sectionId, patternIndex }),
    makeAsynchronous: (sectionId: number) =>
      dispatch({ type: "madeAsynchronous", sectionId }),
    saveDraft: (sectionId: number) =>
      dispatch({ type: "draftSaved", sectionId }),
    cancelDraft: (sectionId: number) =>
      dispatch({ type: "draftCancelled", sectionId }),
    cancelSection: (sectionId: number) =>
      dispatch({ type: "sectionCancelled", sectionId }),
    revertSection: (sectionId: number) =>
      dispatch({ type: "sectionEditsReverted", sectionId }),
    markEditsPersisted: (sectionId: number, saved: SectionEdit) =>
      dispatch({ type: "sectionEditsPersisted", sectionId, saved }),

    /* Creating and deleting, which the sheet drives. */
    markSectionCreated: (sectionId: number) =>
      dispatch({ type: "sectionCreated", sectionId }),
    discardNewSection: () => dispatch({ type: "newSectionDiscarded" }),
    confirmDismissal: () => dispatch({ type: "dismissalConfirmed" }),
    cancelDismissal: () => dispatch({ type: "dismissalCancelled" }),
    markSectionDeleted: (sectionId: number) =>
      dispatch({ type: "sectionDeleted", sectionId }),
  });
}
