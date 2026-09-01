/**
 * The dictionary: every state the schedule editor can be in, and every event
 * that can change it. Reading this file tells you the whole surface.
 */

import type {
  FilterFacet,
  Meeting,
  ScheduleFilters,
  TimeRange,
} from "../types";

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
  /**
   * A block is held but not yet carried. Release now is a click, which
   * selects the meeting. Moving far enough turns it into `moving`.
   */
  | {
      status: "pressed";
      meetingId: string;
      grabbedAfterStart: number;
      /** Where the press landed, which a drag must leave before it counts. */
      dayIndex: number;
      minute: number;
    }
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
  /**
   * The meeting whose block the user clicked, which the page opens a detail
   * sheet for. Keyed by meeting rather than section, since the editor only
   * knows meetings; the page maps a meeting id to its section.
   */
  selectedMeetingId: string | null;
  /**
   * What the sidebar has checked. Kept here rather than applied here: the
   * page filters the sections payload with it before the meetings become
   * `base`, so the editor never needs to know what a section is.
   */
  filters: ScheduleFilters;
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
  /** Escape. Mid-gesture this discards the gesture. At rest it clears the selection. */
  | { type: "cancelled" }
  /** The detail sheet's close button. */
  | { type: "deselected" }
  /** A checkbox checked, or a whole course level's checkboxes at once. */
  | { type: "filterValuesAdded"; facet: FilterFacet; values: string[] }
  /** A checkbox unchecked, a chip's ×, or a whole course level at once. */
  | { type: "filterValuesRemoved"; facet: FilterFacet; values: string[] }
  | { type: "filtersCleared" }
  /** The URL changed underneath the page: initial load, back button, pasted link. */
  | { type: "filtersReplaced"; filters: ScheduleFilters };

/**
 * Something `update` wants done outside itself. Named for the outcome, not
 * the mechanism: the page decides that "sync to the URL" means
 * `router.replace`, so `update` never imports the router.
 */
export type Effect = { type: "syncFiltersToUrl"; filters: ScheduleFilters };

/** What one event produces: the next state, and any effects to run. */
export interface Step {
  state: EditorState;
  effects: Effect[];
}
