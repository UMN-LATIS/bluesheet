/**
 * Binds the pure editor to Vue: named reads and methods, never the state
 * or `dispatch`. Effects run in a microtask so the state swap lands first.
 */

import { computed, reactive, type Ref, shallowRef } from "vue";
import type { FilterFacet, ScheduleFilters, SisSection } from "../types";
import { sectionProblems } from "./validation";
import type { SectionEdit } from "./types";
import type { SisDay } from "../types";
import {
  selectDraftSection,
  selectHasEdits,
  selectIsDraftDirty,
  selectLocalSection,
  selectMeetings,
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
  // replaced whole, never mutated
  const state = shallowRef(initialState());

  const dispatch = (event: EditorEvent) => {
    const next = update(state.value, event, context.value, {
      createUuid: () => crypto.randomUUID(),
    });
    state.value = next.state;
    next.effects.forEach((effect) => queueMicrotask(() => runEffect(effect)));
  };

  return reactive({
    meetings: computed(() => selectMeetings(context.value, state.value)),
    localSections: (sections: SisSection[]) =>
      sections.map((section) => selectLocalSection(section, state.value)),
    filters: computed(() => state.value.filters),
    selection: computed(() => state.value.selection),
    isGestureInFlight: computed(
      () => state.value.interaction.status !== "idle",
    ),
    draftSection: (section: SisSection) =>
      selectDraftSection(section, state.value),
    isDraftDirty: (section: SisSection) =>
      selectIsDraftDirty(section, state.value),
    hasEdits: (sectionId: number) => selectHasEdits(sectionId, state.value),
    draftProblems: (section: SisSection) =>
      sectionProblems(selectDraftSection(section, state.value)),

    weekView: (dayCount: number) =>
      selectWeekView(context.value, state.value, dayCount),

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
    replaceFilters: (filters: ScheduleFilters) =>
      dispatch({ type: "filtersReplaced", filters }),

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
  });
}
