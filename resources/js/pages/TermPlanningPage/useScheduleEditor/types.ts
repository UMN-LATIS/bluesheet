/**
 * The dictionary: every state the schedule editor can be in, and every event
 * that can change it. Reading this file tells you the whole surface.
 */

import type { Meeting, TimeRange } from "../types";

/** Which end of a meeting is being dragged while it is resized. */
export type MeetingEdge = "start" | "end";

/** Where a meeting sits: one weekday, and a time range within it. */
export type Placement = { dayIndex: number } & TimeRange;

/**
 * What the pointer is in the middle of doing, if anything.
 *
 * Each gesture accumulates its in-flight edit here and leaves `meetings` at
 * rest until `released` commits it. So lanes hold still with nothing pinning
 * them, a carried meeting's origin block stays visible where it was, and
 * `cancelled` reverts by plain discard.
 */
export type Interaction =
  | { status: "idle" }
  | ({ status: "drawing"; dayIndex: number; anchorMinute: number } & TimeRange)
  | ({
      status: "moving";
      meetingId: string;
      grabbedAfterStart: number;
      dayIndex: number;
    } & TimeRange)
  | ({
      status: "resizing";
      meetingId: string;
      edge: MeetingEdge;
      dayIndex: number;
    } & TimeRange);

/**
 * Only the local edits live here. The schedule itself — the sections the
 * server returned — stays in the query cache, and `mergeSchedule` lays these
 * edits over it. So a refetch can swap the base out underneath without
 * touching anything the user has done.
 */
export interface EditorState {
  /** Meetings drawn on the grid; they exist nowhere but this browser. */
  drawn: Meeting[];
  /** Base meetings the user has dragged or resized, keyed by meeting id. */
  overrides: Record<string, Placement>;
  interaction: Interaction;
  /**
   * The meeting the last gesture placed, which the grid flashes so a drop
   * is visible. Cleared by the next press, so dropping one meeting twice
   * flashes twice.
   */
  lastPlacedId: string | null;
  /** Names meetings that exist only in the browser so far. */
  nextLocalId: number;
}

/**
 * Something that happened, named in the past tense. The grid measures the
 * page and reports the day and minute a pointer landed on; deciding what that
 * means — snapping included, so minutes arrive fractional — belongs to
 * `update`.
 */
export type EditorEvent =
  | { type: "pressedEmptySpace"; dayIndex: number; minute: number }
  | { type: "pressedMeeting"; meetingId: string; minute: number }
  | {
      type: "pressedMeetingEdge";
      meetingId: string;
      edge: MeetingEdge;
      minute: number;
    }
  | { type: "pointerMoved"; dayIndex: number; minute: number }
  | { type: "released" }
  | { type: "cancelled" };
