/**
 * The dictionary: every state the schedule editor can be in, and every event
 * that can change it. Reading this file tells you the whole surface.
 */

import type { Meeting, TimeRange } from "../types";

/** What the pointer is in the middle of doing, if anything. */
export type Interaction =
  | { status: "idle" }
  | ({ status: "drawing"; dayIndex: number; anchorMinute: number } & TimeRange)
  | { status: "moving"; meetingId: string; grabbedAfterStart: number };

export interface EditorState {
  meetings: Meeting[];
  interaction: Interaction;
  /** Names meetings that exist only in the browser so far. */
  nextLocalId: number;
}

/**
 * Something that happened, named in the past tense. The grid measures the
 * page and reports the day and minute a pointer landed on; deciding what that
 * means belongs to `update`.
 */
export type EditorEvent =
  | { type: "pressedEmptySpace"; dayIndex: number; minute: number }
  | { type: "pressedMeeting"; meetingId: string; minute: number }
  | { type: "pointerMoved"; dayIndex: number; minute: number }
  | { type: "released" }
  | { type: "cancelled" };
