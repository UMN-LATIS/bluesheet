import type {
  Delivery,
  FilterFacet,
  ScheduleFilters,
  SisDay,
  SisInstructor,
  SisSection,
  SisSectionMeeting,
  TimeRange,
  UrlQuery,
} from "../types";
import type { ScheduleView } from "../helpers/viewQuery";

/**
 * Read by `update`, never written: the schedule as it stands, edits applied.
 */
export interface ScheduleContext {
  /**
   * The term as the server sent it, before this browser's edits and before
   * the filters. Everything else the editor reads is derived from it here, so
   * nothing the editor owns travels back in as context.
   */
  sections: SisSection[];
  /**
   * A closed term, or one the save endpoints cannot reach yet. Hiding the
   * controls is not enforcement — keyboard, deep link, and stale tab all still
   * reach `update` — so the refusal lives here too.
   */
  isReadOnly: boolean;
}

/** Sparse: an absent field is unchanged. */
export interface SectionEdit {
  /**
   * Which course the section is on. Only the section being created sets
   * these: an existing section's course is half of the key the server
   * enforces, so moving one to another course is a delete and a create.
   */
  courseCode?: string;
  subject?: string;
  catalogNumber?: string;
  title?: string;
  credits?: number | null;
  section?: string;
  component?: string;
  delivery?: Delivery;
  meetings?: SisSectionMeeting[];
  instructors?: SisInstructor[];
  enrollmentCap?: number;
  notes?: string;
  isCancelled?: boolean;
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

/**
 * The id the section being created stands under while the sheet is open on
 * it. Negative because section ids are auto-increment, so no saved section
 * can ever collide with it.
 */
export const NEW_SECTION_ID = -1;

/** Only this browser's edits; the server's sections stay in the query cache. */
export interface EditorState {
  sectionEdits: Record<number, SectionEdit>;
  /**
   * The sheet's unsaved form per section; nothing here reaches the grid until
   * Save. The exception is `NEW_SECTION_ID`, whose draft is the whole of the
   * section being created: it has no row on the server and no entry in
   * `context.sections`, so the grid draws its blocks straight from here.
   */
  drafts: Record<number, SectionEdit>;
  /**
   * The event held back because applying it would drop sheet edits nobody has
   * saved. The view asks about it, and the answer arrives as
   * `dismissalConfirmed` or `dismissalCancelled`, which is what keeps the
   * question out of `update` and out of a browser dialog.
   */
  pendingDismissal: EditorEvent | null;
  interaction: Interaction;
  /** Flashed by the grid; cleared by the next press. */
  lastPlacedId: string | null;
  selection: Selection | null;
  /** Applied by the page before placing, not here. */
  filters: ScheduleFilters;
  /** Which canvas is showing. */
  view: ScheduleView;
  /** Which tab the day list is on: a weekday, or the Async day past them. */
  dayIndex: number;
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
  | { type: "viewSelected"; view: ScheduleView }
  | { type: "daySelected"; dayIndex: number }
  /** The heatmap's Async cell: one step to the day list, on the Async tab. */
  | { type: "asyncDayShown" }
  /**
   * The URL changed underneath the page: initial load, back button, pasted
   * link, or the page's own `replaceUrlQuery` arriving back. The only way any
   * URL-backed state is written, and the only event that raises no effect,
   * which is what stops the page and the router answering each other forever.
   */
  | { type: "urlChanged"; query: UrlQuery }
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
  /**
   * The section is struck from the term. Confirmed in the sheet before it is
   * dispatched, and undone only by reverting the section.
   */
  | { type: "sectionCancelled"; sectionId: number }
  | { type: "sectionEditsReverted"; sectionId: number }
  /**
   * Create was pressed and the server has the section now, so the draft that
   * stood for it can go and the sheet can reopen on the real thing.
   */
  | { type: "sectionCreated"; sectionId: number }
  /** The sheet closed on a section that was never created. */
  | { type: "newSectionDiscarded" }
  /**
   * The server no longer has this section. Its overlay and its draft go with
   * it; leaving either would save a section back into existence.
   */
  | { type: "sectionDeleted"; sectionId: number }
  /** The reader let the held event through, losing the sheet's edits. */
  | { type: "dismissalConfirmed" }
  /** The reader kept the edits, so the held event never happened. */
  | { type: "dismissalCancelled" }
  /**
   * The server has these edits now, so the overlay holding them can go. The
   * edits are named rather than assumed, because the scheduler may have typed
   * again while the save was in flight, and that newer edit has to survive.
   */
  | {
      type: "sectionEditsPersisted";
      sectionId: number;
      saved: SectionEdit;
    };

/**
 * Work for the page to do outside `update`, which never imports the router.
 * The query holds every key the editor owns, so the page clears that whole set
 * before writing this over it; a key the editor left out is one to remove.
 */
export type Effect = { type: "replaceUrlQuery"; query: UrlQuery };

export interface Next {
  state: EditorState;
  effects: Effect[];
}
