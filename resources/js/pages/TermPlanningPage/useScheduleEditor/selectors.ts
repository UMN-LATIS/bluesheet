import type { Meeting, PlannedSection, SisSection, TimeRange } from "../types";
import { FILTER_FACETS } from "../types";
import { isEqual } from "lodash-es";
import { type DayLayout, layOutDay } from "../helpers/dayLayout";
import { filterSections } from "../helpers/scheduleFilters";
import {
  GRID_DAYS,
  meetingIdOf,
  placeSections,
  sectionIdOfMeetingId,
  type PlacedSections,
} from "../helpers/sectionPlacement";
import { minutesFromClock } from "../helpers/timeScale";
import { NEW_SECTION_ID } from "./types";
import type {
  EditorState,
  HourSelection,
  Interaction,
  ScheduleContext,
} from "./types";

/** The SIS section with this browser's edits applied. */
export function selectLocalSection(
  section: SisSection,
  state: EditorState,
): PlannedSection {
  return {
    delivery: "onCampus",
    notes: "",
    isCancelled: false,
    ...section,
    ...state.sectionEdits[section.id],
  };
}

/** The local section with the sheet's draft applied. */
export function selectDraftSection(
  section: SisSection,
  state: EditorState,
): PlannedSection {
  return {
    ...selectLocalSection(section, state),
    ...state.drafts[section.id],
  };
}

// compared by value, so retyping the original leaves the form clean
export function selectIsDraftDirty(
  section: SisSection,
  state: EditorState,
): boolean {
  const draft = state.drafts[section.id];
  if (!draft) return false;

  const local = selectLocalSection(section, state);

  return Object.entries(draft).some(
    ([field, value]) => !isEqual(value, local[field as keyof PlannedSection]),
  );
}

export const selectHasEdits = (sectionId: number, state: EditorState) =>
  state.sectionEdits[sectionId] !== undefined;

/**
 * How many values are checked across every facet, which is what the filter
 * button's badge counts and what the sidebar calls a filter being "active".
 */
export const selectActiveFilterCount = (state: EditorState): number =>
  FILTER_FACETS.reduce((sum, facet) => sum + state.filters[facet].length, 0);

/*
 * The four readings of `Selection` the canvases need. They live here rather
 * than in each canvas so that a new variant of the union is a type error in
 * one file instead of a silent miss in three components.
 */

/** The chip or card the day list marks, if a section is what is selected. */
export const selectSelectedSectionId = (state: EditorState): number | null =>
  state.selection?.kind === "section" ? state.selection.sectionId : null;

/** The block the week grid marks, if a block is what is selected. */
export const selectSelectedMeetingId = (state: EditorState): string | null =>
  state.selection?.kind === "meeting" ? state.selection.meetingId : null;

/** The hour whose own sheet is open, which is not the same as `markedHour`. */
export const selectOpenHour = (state: EditorState): HourSelection | null =>
  state.selection?.kind === "hour" ? state.selection : null;

/** The hour list a selected section was picked from, for the sheet's back link. */
export const selectHourReturnedTo = (
  state: EditorState,
): HourSelection | null =>
  state.selection?.kind === "section" ? (state.selection.from ?? null) : null;

/**
 * The heatmap cell that reads as chosen: the hour whose sheet is open, or else
 * the hour a section was picked from, so the cell a scheduler came through
 * stays marked while that section's sheet stands in the hour sheet's place.
 */
export const selectMarkedHour = (state: EditorState): HourSelection | null =>
  selectOpenHour(state) ?? selectHourReturnedTo(state);

/** Every section as the reader sees it: the server's, this browser's edits on top. */
export const selectLocalSections = (
  context: ScheduleContext,
  state: EditorState,
): PlannedSection[] =>
  context.sections.map((section) => selectLocalSection(section, state));

/**
 * The sections the canvases draw, laid out in lanes. The filters are applied
 * here rather than by the page, so what the editor decides never has to travel
 * back in as context.
 */
export const selectPlaced = (
  context: ScheduleContext,
  state: EditorState,
): PlacedSections =>
  placeSections(
    filterSections(selectLocalSections(context, state), state.filters),
  );

export function selectMeetings(
  context: ScheduleContext,
  state: EditorState,
): Meeting[] {
  return [
    ...selectPlaced(context, state).meetings,
    ...selectNewSectionMeetings(state),
  ];
}

/**
 * The blocks for the section being created. It has no row on the server and
 * no entry in `context.sections`, so its draft is the only place its times
 * live and the grid reads them straight from here.
 */
export function selectNewSectionMeetings(state: EditorState): Meeting[] {
  const patterns = state.drafts[NEW_SECTION_ID]?.meetings ?? [];

  return patterns.flatMap((pattern) =>
    pattern.days.flatMap((day) => {
      const dayIndex = GRID_DAYS.indexOf(day);
      if (dayIndex < 0) return [];

      return [
        {
          id: meetingIdOf(NEW_SECTION_ID, day, pattern.startTime),
          dayIndex,
          sectionId: NEW_SECTION_ID,
          startMinute: minutesFromClock(pattern.startTime),
          endMinute: minutesFromClock(pattern.endTime),
        },
      ];
    }),
  );
}

/**
 * The section the sheet is open on, whether it was reached by its own chip or
 * by one of its blocks. A block's id is read rather than matched against the
 * blocks on the grid: changing the day in the sheet renames them, and the
 * sheet must not close when it does.
 */
export function selectOpenSectionId(state: EditorState): number | null {
  const { selection } = state;

  if (selection?.kind === "section") return selection.sectionId;
  if (selection?.kind === "meeting") {
    return sectionIdOfMeetingId(selection.meetingId);
  }

  return null;
}

export const selectIsNewSectionSelected = (state: EditorState): boolean =>
  selectOpenSectionId(state) === NEW_SECTION_ID;

/**
 * Whether this change would drop sheet edits nobody has saved. The shell asks
 * before letting it through, which is why this reports rather than acts.
 *
 * A section being created counts only once it has a course: before that it is
 * a rectangle, and asking about it would make a stray click a question.
 */
export function selectAbandonsUnsavedWork(
  before: EditorState,
  after: EditorState,
  context: ScheduleContext,
): boolean {
  const left = selectOpenSectionId(before);
  if (left === null || selectOpenSectionId(after) === left) return false;

  const draft = before.drafts[left];
  if (!draft) return false;

  if (left === NEW_SECTION_ID) return draft.courseCode !== undefined;

  const section = context.sections.find(({ id }) => id === left);
  return section !== undefined && selectIsDraftDirty(section, before);
}

/** Unsaved work the page warns about before it lets the reader leave. */
export const selectIsCreatingSection = (state: EditorState): boolean =>
  state.drafts[NEW_SECTION_ID] !== undefined;

export interface DayView {
  layout: DayLayout;
  /**
   * A block being drawn or carried over this day; ids are null while drawing.
   */
  overlay:
    | (TimeRange & { meetingId: string | null; sectionId: number | null })
    | null;
  activeMeetingId: string | null;
  ghostMeetingId: string | null;
  justPlacedMeetingId: string | null;
  selectedMeetingId: string | null;
}

export function selectWeekView(
  context: ScheduleContext,
  state: EditorState,
  dayCount: number,
): DayView[] {
  const meetings = selectMeetings(context, state);

  return Array.from({ length: dayCount }, (_, dayIndex) =>
    selectDayView(meetings, state, dayIndex),
  );
}

function selectDayView(
  all: Meeting[],
  state: EditorState,
  dayIndex: number,
): DayView {
  const { interaction } = state;

  const meetings = all.filter((meeting) => meeting.dayIndex === dayIndex);
  const selectedMeetingId = selectSelectedMeetingId(state);

  return {
    layout: withLiveResize(layOutDay(meetings), interaction),
    overlay: overlayIn(interaction, dayIndex, all),
    activeMeetingId:
      interaction.status === "resizing" ? interaction.meetingId : null,
    ghostMeetingId:
      interaction.status === "moving" ? interaction.meetingId : null,
    // only in the day it landed in, so a cross-day
    // move does not flash the old column
    justPlacedMeetingId: meetings.some(({ id }) => id === state.lastPlacedId)
      ? state.lastPlacedId
      : null,
    selectedMeetingId: meetings.some(({ id }) => id === selectedMeetingId)
      ? selectedMeetingId
      : null,
  };
}

/**
 * Draws the resized meeting at its draft range without repacking its neighbors.
 */
function withLiveResize(
  layout: DayLayout,
  interaction: Interaction,
): DayLayout {
  if (interaction.status !== "resizing") return layout;

  return {
    ...layout,
    placed: layout.placed.map((placed) =>
      placed.meeting.id === interaction.meetingId
        ? {
            ...placed,
            meeting: {
              ...placed.meeting,
              startMinute: interaction.startMinute,
              endMinute: interaction.endMinute,
            },
          }
        : placed,
    ),
  };
}

function overlayIn(
  interaction: Interaction,
  dayIndex: number,
  all: Meeting[],
): DayView["overlay"] {
  const isOverThisDay =
    (interaction.status === "drawing" || interaction.status === "moving") &&
    interaction.dayIndex === dayIndex;

  if (!isOverThisDay) return null;

  const meetingId =
    interaction.status === "moving" ? interaction.meetingId : null;

  return {
    startMinute: interaction.startMinute,
    endMinute: interaction.endMinute,
    meetingId,
    sectionId: all.find(({ id }) => id === meetingId)?.sectionId ?? null,
  };
}
