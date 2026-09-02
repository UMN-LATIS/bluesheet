import type { Meeting, PlannedSection, SisSection, TimeRange } from "../types";
import { isEqual } from "lodash-es";
import { type DayLayout, layOutDay } from "../helpers/dayLayout";
import type { EditorState, Interaction, ScheduleContext } from "./types";

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

export function selectMeetings(
  context: ScheduleContext,
  state: EditorState,
): Meeting[] {
  return [...context.meetings, ...state.placeholderMeetings];
}

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

  const selectedMeetingId =
    state.selection?.kind === "meeting" ? state.selection.meetingId : null;

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
