import type {
  Delivery,
  FilterFacet,
  Meeting,
  PlannedSection,
  ScheduleFilters,
  SisDay,
  SisInstructor,
  SisSectionMeeting,
  TimeRange,
} from "../types";

/**
 * Read by `update`, never written: the schedule as it stands, edits applied.
 */
export interface ScheduleContext {
  meetings: Meeting[];
  sections: PlannedSection[];
}

/** Sparse: an absent field is unchanged. */
export interface SectionEdit {
  section?: string;
  component?: string;
  delivery?: Delivery;
  meetings?: SisSectionMeeting[];
  instructors?: SisInstructor[];
  enrollmentCap?: number;
  notes?: string;
}

export type MeetingEdge = "start" | "end";

export type Placement = { dayIndex: number } & TimeRange;

/**
 * The gesture in progress; its draft is
 * written to the schedule only on `released`.
 */
export type Interaction =
  | { status: "idle" }
  | ({ status: "drawing"; dayIndex: number; anchorMinute: number } & TimeRange)
  /**
   * Held, not yet carried: release is a click,
   * moving far enough becomes `moving`.
   */
  | {
      status: "pressed";
      meetingId: string;
      grabbedAfterStart: number;
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

/** A grid block by meeting id, a tray chip by section id, or a heatmap hour. */
export type Selection =
  | { kind: "meeting"; meetingId: string }
  | {
      kind: "section";
      sectionId: number;
      /**
       * The hour list this section was picked from, for the sheet's back link.
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

/** Only this browser's edits; the server's sections stay in the query cache. */
export interface EditorState {
  /** Times drawn on empty space, belonging to no section. */
  placeholderMeetings: Meeting[];
  sectionEdits: Record<number, SectionEdit>;
  /**
   * The sheet's unsaved form per section;
   * nothing here reaches the grid until Save.
   */
  drafts: Record<number, SectionEdit>;
  interaction: Interaction;
  /** Flashed by the grid; cleared by the next press. */
  lastPlacedId: string | null;
  selection: Selection | null;
  /** Applied by the page before placing, not here. */
  filters: ScheduleFilters;
}

/** Past-tense facts from the UI; minutes arrive unsnapped. */
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
  /**
   * Escape. Mid-gesture this discards the
   * gesture. At rest it clears the selection.
   */
  | { type: "canceled" }
  | { type: "deselected" }
  /**
   * A chip in the no-set-time tray, or a row in the hour sheet (which names the
   * hour it came from).
   */
  | { type: "selectedSection"; sectionId: number; from?: HourSelection }
  | { type: "selectedHour"; dayIndex: number; startMinute: number }
  | { type: "filterValuesAdded"; facet: FilterFacet; values: string[] }
  | { type: "filterValuesRemoved"; facet: FilterFacet; values: string[] }
  | { type: "filtersCleared" }
  /**
   * The URL changed underneath the page:
   * initial load, back button, pasted link.
   */
  | { type: "filtersReplaced"; filters: ScheduleFilters }
  | { type: "sectionFieldEdited"; sectionId: number; change: SectionEdit }
  /** A day pressed in the sheet. An index past the last pattern starts one. */
  | {
      type: "meetingDayToggled";
      sectionId: number;
      patternIndex: number;
      day: SisDay;
    }
  | {
      type: "meetingTimeEdited";
      sectionId: number;
      patternIndex: number;
      startTime?: string;
      endTime?: string;
    }
  | { type: "meetingPatternAdded"; sectionId: number }
  | { type: "meetingPatternRemoved"; sectionId: number; patternIndex: number }
  /** The Async day: the section keeps no meeting time at all. */
  | { type: "madeAsynchronous"; sectionId: number }
  | { type: "draftSaved"; sectionId: number }
  | { type: "draftCancelled"; sectionId: number }
  | { type: "sectionEditsReverted"; sectionId: number };

/** Work for the page to do outside `update`, which never imports the router. */
export type Effect = { type: "syncFiltersToUrl"; filters: ScheduleFilters };

export interface Next {
  state: EditorState;
  effects: Effect[];
}

/** Injected so `update` stays deterministic. */
export interface EditorDeps {
  createUuid: () => string;
}
