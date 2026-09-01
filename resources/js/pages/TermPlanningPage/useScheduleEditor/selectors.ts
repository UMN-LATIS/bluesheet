/**
 * Reads over the editor state. Every derived value a component needs comes
 * from one of these, so the state's shape stays private to this directory.
 */

import type { Meeting, TimeRange } from "../types";
import { type DayLayout, layOutDay } from "../helpers/dayLayout";
import { mergeSchedule } from "./mergeSchedule";
import type { EditorState, Interaction } from "./types";

/** Everything one day column draws. */
export interface DayView {
  layout: DayLayout;
  /**
   * A block in flight over this day: one being drawn out, or one the pointer
   * is carrying. It spans the full column rather than taking a lane, since it
   * is not placed until it is let go of.
   *
   * `meetingId` is null while a block is drawn out, since no meeting exists
   * to name yet.
   */
  overlay: (TimeRange & { meetingId: string | null }) | null;
  /** The placed block being resized here, drawn at its live range. */
  activeMeetingId: string | null;
  /** The placed block whose meeting the pointer is carrying, drawn faded. */
  ghostMeetingId: string | null;
  /** The block the last gesture placed, which flashes once where it landed. */
  justPlacedMeetingId: string | null;
}

/** One `DayView` per day, index-aligned with the grid's columns. */
export function selectWeekView(
  base: Meeting[],
  state: EditorState,
  dayCount: number,
): DayView[] {
  const merged = mergeSchedule(base, state);

  return Array.from({ length: dayCount }, (_, dayIndex) =>
    selectDayView(merged, state, dayIndex),
  );
}

function selectDayView(
  merged: Meeting[],
  state: EditorState,
  dayIndex: number,
): DayView {
  const { interaction } = state;

  const meetings = merged.filter((meeting) => meeting.dayIndex === dayIndex);

  return {
    layout: withLiveResize(layOutDay(meetings), interaction),
    overlay: overlayIn(interaction, dayIndex),
    activeMeetingId:
      interaction.status === "resizing" ? interaction.meetingId : null,
    ghostMeetingId:
      interaction.status === "moving" ? interaction.meetingId : null,
    // Named only in the day it landed in, so a move across days does not
    // flash the column it left.
    justPlacedMeetingId: meetings.some(({ id }) => id === state.lastPlacedId)
      ? state.lastPlacedId
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
): DayView["overlay"] {
  const isOverThisDay =
    (interaction.status === "drawing" || interaction.status === "moving") &&
    interaction.dayIndex === dayIndex;

  if (!isOverThisDay) return null;

  return {
    startMinute: interaction.startMinute,
    endMinute: interaction.endMinute,
    meetingId: interaction.status === "moving" ? interaction.meetingId : null,
  };
}
