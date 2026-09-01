/**
 * Reads over the editor state. Every derived value a component needs comes
 * from one of these, so the state's shape stays private to this directory.
 */

import type { TimeRange } from "../types";
import { type DayLayout, layOutDay } from "../helpers/dayLayout";
import type { EditorState, Interaction } from "./types";

/** Everything one day column draws. */
export interface DayView {
  layout: DayLayout;
  /**
   * A block in flight over this day: one being drawn out, or one the pointer
   * is carrying. It spans the full column rather than taking a lane, since it
   * is not placed until it is let go of.
   */
  overlay: TimeRange | null;
  /** The placed block being resized here, drawn at its live range. */
  activeMeetingId: string | null;
  /** The placed block whose meeting the pointer is carrying, drawn faded. */
  ghostMeetingId: string | null;
}

/** One `DayView` per day, index-aligned with the grid's columns. */
export function selectWeekView(
  state: EditorState,
  dayCount: number,
): DayView[] {
  return Array.from({ length: dayCount }, (_, dayIndex) =>
    selectDayView(state, dayIndex),
  );
}

function selectDayView(state: EditorState, dayIndex: number): DayView {
  const { interaction } = state;

  const meetings = state.meetings.filter(
    (meeting) => meeting.dayIndex === dayIndex,
  );

  return {
    layout: withLiveResize(layOutDay(meetings), interaction),
    overlay: overlayIn(interaction, dayIndex),
    activeMeetingId:
      interaction.status === "resizing" ? interaction.meetingId : null,
    ghostMeetingId:
      interaction.status === "moving" ? interaction.meetingId : null,
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
): TimeRange | null {
  const isOverThisDay =
    (interaction.status === "drawing" || interaction.status === "moving") &&
    interaction.dayIndex === dayIndex;

  return isOverThisDay
    ? { startMinute: interaction.startMinute, endMinute: interaction.endMinute }
    : null;
}
