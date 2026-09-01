/**
 * Reads over the editor state. Every derived value a component needs comes
 * from one of these, so the state's shape stays private to this directory.
 */

import type { TimeRange } from "../types";
import {
  type DayLayout,
  type LaneAssignment,
  layOutDay,
} from "../helpers/dayLayout";
import type { EditorState, Interaction } from "./types";

/** Everything one day column draws. */
export interface DayView {
  layout: DayLayout;
  /** The meeting being drawn out here, while the pointer is still down. */
  drawing: TimeRange | null;
  /** The meeting the pointer is carrying or lengthening, anywhere in the week. */
  activeMeetingId: string | null;
}

export function selectDayView(state: EditorState, dayIndex: number): DayView {
  const meetings = state.meetings.filter(
    (meeting) => meeting.dayIndex === dayIndex,
  );

  return {
    layout: layOutDay(meetings, heldLanes(state.interaction)),
    drawing: drawingIn(state.interaction, dayIndex),
    activeMeetingId: activeMeetingId(state.interaction),
  };
}

/**
 * Lanes are worked out afresh while the grid is at rest, and held to those
 * recorded at the start of a gesture for as long as it lasts.
 */
function heldLanes(interaction: Interaction): LaneAssignment | undefined {
  return interaction.status === "moving" || interaction.status === "resizing"
    ? interaction.lockedLanes
    : undefined;
}

function drawingIn(
  interaction: Interaction,
  dayIndex: number,
): TimeRange | null {
  return interaction.status === "drawing" && interaction.dayIndex === dayIndex
    ? interaction
    : null;
}

/** Both gestures count: either one lifts a meeting above its neighbours. */
function activeMeetingId(interaction: Interaction): string | null {
  return interaction.status === "moving" || interaction.status === "resizing"
    ? interaction.meetingId
    : null;
}
