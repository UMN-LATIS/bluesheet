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
 * The context is the schedule as it currently stands, owned by the query
 * cache and passed in as a ref. The editor state holds only what this
 * browser changed, so a refetch replaces the context underneath without
 * disturbing the user's edits.
 *
 * Effects run through the `runEffect` the page supplies, since the page owns
 * the router and, later, the API client. They are queued for the next
 * microtask so the state swap lands first and an effect's own dispatch
 * stacks after this one rather than nesting inside it.
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

/** Everything a component may read or call. */
export type ScheduleEditor = ReturnType<typeof useScheduleEditor>;

export function useScheduleEditor(
  context: Readonly<Ref<ScheduleContext>>,
  runEffect: (effect: Effect) => void,
) {
  // Replaced whole and never mutated, so deep reactivity would be cost with
  // no payoff.
  const state = shallowRef(initialState());

  const dispatch = (event: EditorEvent) => {
    const next = update(state.value, event, context.value, {
      createUuid: () => crypto.randomUUID(),
    });
    state.value = next.state;
    next.effects.forEach((effect) => queueMicrotask(() => runEffect(effect)));
  };

  // Reactive rather than a bag of refs, so no call site writes `.value` and
  // a template reads the editor as plainly as a component's own state.
  return reactive({
    /** Every block the grid draws, placeholder times included. */
    meetings: computed(() => selectMeetings(context.value, state.value)),
    /**
     * The sections as the user sees them: the SIS rows with this browser's
     * edits over them. The page places these, so one edit reaches the grid,
     * the heatmap, the tray and the sheet at once.
     */
    localSections: (sections: SisSection[]) =>
      sections.map((section) => selectLocalSection(section, state.value)),
    filters: computed(() => state.value.filters),
    selection: computed(() => state.value.selection),
    /** Whether a gesture is under way, which is when a pointer move means something. */
    isGestureInFlight: computed(
      () => state.value.interaction.status !== "idle",
    ),
    /** The section as the sheet's form holds it, unsaved keystrokes included. */
    draftSection: (section: SisSection) =>
      selectDraftSection(section, state.value),
    /** Whether the sheet's Save would change anything. */
    isDraftDirty: (section: SisSection) =>
      selectIsDraftDirty(section, state.value),
    /** Whether a section reads as anything other than what the SIS holds. */
    hasEdits: (sectionId: number) => selectHasEdits(sectionId, state.value),
    /** What the form gets wrong, which is what holds Save back. */
    draftProblems: (section: SisSection) =>
      sectionProblems(selectDraftSection(section, state.value)),

    /** Everything the week grid's columns draw, one entry per day. */
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
    /** Escape. Mid-gesture this discards the gesture. At rest it clears the selection. */
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
    /** The URL changed underneath the page: initial load, back button, pasted link. */
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
    revertSection: (sectionId: number) =>
      dispatch({ type: "sectionEditsReverted", sectionId }),
  });
}
