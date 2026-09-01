/**
 * Reads over the editor state. Every derived value a component needs comes
 * from one of these, so the state's shape stays private to this directory.
 */

import type { Meeting, TimeRange } from "../types";
import type { EditorState } from "./types";

export function selectMeetingsOn(
  state: EditorState,
  dayIndex: number,
): Meeting[] {
  return state.meetings.filter((meeting) => meeting.dayIndex === dayIndex);
}

/** The meeting being drawn out in this day, while the pointer is still down. */
export function selectDrawingIn(
  state: EditorState,
  dayIndex: number,
): TimeRange | null {
  const { interaction } = state;

  return interaction.status === "drawing" && interaction.dayIndex === dayIndex
    ? interaction
    : null;
}

/**
 * The meeting currently under the pointer's control, if any. Both gestures
 * count: a resize shifts overlaps just as a move does, so the lanes need
 * holding still for either.
 */
export function selectActiveMeetingId(state: EditorState): string | null {
  const { interaction } = state;

  return interaction.status === "moving" || interaction.status === "resizing"
    ? interaction.meetingId
    : null;
}
