/**
 * The reads that take real work. The trivial ones are computeds on the
 * editor surface in `useScheduleEditor`; either way the state's shape stays
 * private to this directory.
 */

import type { Meeting, PlannedSection, SisSection, TimeRange } from "../types";
import { isEqual } from "lodash-es";
import { type DayLayout, layOutDay } from "../helpers/dayLayout";
import type { EditorState, Interaction, ScheduleContext } from "./types";

/**
 * The section as the user sees it: the SIS row with this browser's edits
 * over it. The one place server truth and local work meet, so every view of
 * the term (the grid, the heatmap, the tray, the sheet) is reading the same
 * section.
 */
export function selectLocalSection(
  section: SisSection,
  state: EditorState,
): PlannedSection {
  return {
    delivery: "onCampus",
    notes: "",
    ...section,
    ...state.sectionEdits[section.id],
  };
}

/**
 * What the sheet's form shows: the local section with the draft over it.
 * Identical to the local section until a field is touched.
 */
export function selectDraftSection(
  section: SisSection,
  state: EditorState,
): PlannedSection {
  return {
    ...selectLocalSection(section, state),
    ...state.drafts[section.id],
  };
}

/**
 * Whether Save would change anything. Compared by value rather than tracked
 * by a flag, so typing a field back to what it was leaves the form clean and
 * a dirty state cannot get stuck.
 */
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

/** Whether this section reads as anything other than what the SIS holds. */
export const selectHasEdits = (sectionId: number, state: EditorState) =>
  state.sectionEdits[sectionId] !== undefined;

/**
 * Every block on the grid: the placed sections, plus the placeholder times
 * held here that belong to no section.
 */
export function selectMeetings(
  context: ScheduleContext,
  state: EditorState,
): Meeting[] {
  return [...context.meetings, ...state.placeholderMeetings];
}

/** Everything one day column draws. */
export interface DayView {
  layout: DayLayout;
  /**
   * A block in flight over this day: one being drawn out, or one the pointer
   * is carrying. It spans the full column rather than taking a lane, since it
   * is not placed until it is let go of.
   *
   * `meetingId` and `sectionId` are null while a block is drawn out, since
   * no meeting exists to name yet.
   */
  overlay:
    | (TimeRange & { meetingId: string | null; sectionId: number | null })
    | null;
  /** The placed block being resized here, drawn at its live range. */
  activeMeetingId: string | null;
  /** The placed block whose meeting the pointer is carrying, drawn faded. */
  ghostMeetingId: string | null;
  /** The block the last gesture placed, which flashes once where it landed. */
  justPlacedMeetingId: string | null;
  /** The selected meeting's id when it lies in this day, else null. */
  selectedMeetingId: string | null;
}

/** One `DayView` per day, index-aligned with the grid's columns. */
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

  // A selected tray section has no block, so no day shows a selection.
  const selectedMeetingId =
    state.selection?.kind === "meeting" ? state.selection.meetingId : null;

  return {
    layout: withLiveResize(layOutDay(meetings), interaction),
    overlay: overlayIn(interaction, dayIndex, all),
    activeMeetingId:
      interaction.status === "resizing" ? interaction.meetingId : null,
    ghostMeetingId:
      interaction.status === "moving" ? interaction.meetingId : null,
    // Named only in the day it landed in, so a move across days does not
    // flash the column it left.
    justPlacedMeetingId: meetings.some(({ id }) => id === state.lastPlacedId)
      ? state.lastPlacedId
      : null,
    selectedMeetingId: meetings.some(({ id }) => id === selectedMeetingId)
      ? selectedMeetingId
      : null,
  };
}

/**
 * A resized meeting keeps the lane the at-rest packing gave it and draws at
 * the draft's range, so its neighbours hold still while one block grows.
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

/** The drawing draft, or the carried meeting, while it is over this day. */
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
