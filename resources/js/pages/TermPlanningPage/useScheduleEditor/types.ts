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
 * What can be selected. A block on the grid is known by its meeting, since
 * that is all the editor knows about it; a section with no meeting time has
 * no block, so its chip in the tray selects it by section id. The page
 * resolves either to a section for the sheet.
 */
export type Selection =
  | { kind: "meeting"; meetingId: string }
  | {
      kind: "section";
      sectionId: number;
      /**
       * The hour whose list this section was picked from, when it was. The
       * sheet offers a way back to that list rather than a plain close.
       */
      from?: HourSelection;
    }
  | HourSelection;

/** A cell of the coverage heatmap: one hour of one day. */
export interface HourSelection {
  kind: "hour";
  dayIndex: number;
  startMinute: number;
}

/**
 * Only the local edits live here. The schedule itself — the sections the
 * server returned — stays in the query cache, and `mergeSchedule` lays these
 * edits over it. So a refetch can swap the base out underneath without
 * touching anything the user has done.
 */
export interface EditorState {
  /**
   * Times held on the grid with no class in them yet: drawn on empty space,
   * belonging to no section. They exist nowhere but this browser.
   */
  placeholderMeetings: Meeting[];
  /** Base meetings the user has dragged or resized, keyed by meeting id. */
  overrides: Record<string, Placement>;
  interaction: Interaction;
  /**
   * The meeting the last gesture placed, which the grid flashes so a drop
   * is visible. Cleared by the next press, so dropping one meeting twice
   * flashes twice.
   */
  lastPlacedId: string | null;
  /** What the user clicked, which the page opens a detail sheet for. */
  selection: Selection | null;
  /**
   * What the sidebar has checked. Kept here rather than applied here: the
   * page filters the sections payload with it before the meetings become
   * `base`, so the editor never needs to know what a section is.
   */
  filters: ScheduleFilters;
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
  /** A chip in the no-set-time tray, or a row in the hour sheet (which names the hour it came from). */
  | { type: "selectedSection"; sectionId: number; from?: HourSelection }
  /** A cell of the coverage heatmap. */
  | { type: "selectedHour"; dayIndex: number; startMinute: number }
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
export interface Next {
  state: EditorState;
  effects: Effect[];
}

/**
 * The impure needs, injected so `update` stays deterministic. A placeholder
 * meeting has no section and so no natural key, which is the one thing here
 * that has to be named out of thin air.
 */
export interface EditorDeps {
  createUuid: () => string;
}
