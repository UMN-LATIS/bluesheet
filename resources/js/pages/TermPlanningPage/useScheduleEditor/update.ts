/**
 * The only writer of editor state. Pure: no DOM, clock, or randomness.
 * Gestures write only their draft until `released` commits.
 */

import { isEqual } from "lodash-es";
import { FILTER_FACETS } from "../types";
import type {
  FilterFacet,
  ScheduleFilters,
  SisSectionMeeting,
  TimeRange,
} from "../types";
import type { UrlQuery } from "@/utils/urlQuery";
import {
  decodeFilters,
  defaultFilters,
  encodeFilters,
} from "../helpers/filterQuery";
import {
  decodeSelection,
  encodeSelection,
  SELECTION_KEYS,
} from "../helpers/selectionQuery";
import {
  decodeDayIndex,
  decodeView,
  DEFAULT_VIEW,
  encodeDayIndex,
  VIEW_KEYS,
} from "../helpers/viewQuery";
import { ASYNC_DAY_INDEX } from "../helpers/scheduleDays";
import {
  clockFromMinutes,
  END_MINUTE,
  snapToGrid,
  START_MINUTE,
} from "../helpers/timeScale";
import {
  GRID_DAYS,
  meetingIdOf,
  sectionIdOfMeetingId,
} from "../helpers/sectionPlacement";
import {
  selectAbandonsUnsavedWork,
  selectLocalSections,
  selectMeetings,
  selectNewSectionMeetings,
  selectOpenSectionId,
} from "./selectors";
import { NEW_SECTION_ID } from "./types";
import {
  DEFAULT_PATTERN,
  withDayToggled,
  withoutOverlaps,
  withPlacement,
  withTimes,
} from "./meetingPatterns";

import type {
  EditorEvent,
  EditorState,
  Effect,
  Interaction,
  MeetingEdge,
  Next,
  Placement,
  ScheduleContext,
} from "./types";

/** What a press with no drag creates: one standard fifty-minute period. */
const CLICK_DURATION = 50;

/** Keeps a block tall enough to read and to grab; not a scheduling rule. */
const MIN_DURATION = 15;

/** In grid minutes (one per pixel): a shorter drag is still a click. */
const DRAG_START_MINUTES = 10;

export const emptyFilters = (): ScheduleFilters => ({
  course: [],
  person: [],
  section: [],
  component: [],
});

/**
 * `dayIndex` is a parameter because today is a clock read, which belongs in the
 * shell: `useScheduleEditor` passes it in, and everything here stays pure.
 */
export const initialState = (dayIndex = 0): EditorState => ({
  sectionEdits: {},
  drafts: {},
  pendingDismissal: null,
  interaction: { status: "idle" },
  lastPlacedId: null,
  selection: null,
  filters: defaultFilters(),
  view: DEFAULT_VIEW,
  dayIndex,
  lastImport: null,
  writeError: null,
  isConfirmingDelete: false,
  filterPanelOverride: null,
});

/**
 * Events after which the sheet is showing something else, so a refusal or a
 * delete question raised against what it showed before no longer applies.
 */
const SHEET_MOVED_ON: EditorEvent["type"][] = [
  "selectedSection",
  "selectedHour",
  "selectedLeave",
  "deselected",
  "canceled",
  "sectionCreated",
  "sectionDeleted",
  "allSectionsDeleted",
  "newSectionDiscarded",
  "contextChanged",
  "urlChanged",
];

/**
 * Every query key the editor owns. The page clears these before writing an
 * effect's query over them, so a key the effect leaves out is cleared rather
 * than left standing from whatever the URL said before.
 */
export const EDITOR_QUERY_KEYS = [
  ...FILTER_FACETS,
  ...SELECTION_KEYS,
  ...VIEW_KEYS,
];

/**
 * Events that drop a draft because that is what the reader asked for. The
 * shell does not ask again before letting one of these through.
 */
export const DISCARDS_ON_PURPOSE: EditorEvent["type"][] = [
  "contextChanged",
  "newSectionDiscarded",
  "sectionCreated",
  "sectionDeleted",
  "allSectionsDeleted",
  // the server has already deleted the sections, so there is nothing left to ask
  "importUndone",
  "draftCancelled",
  "draftSaved",
  "sectionEditsReverted",
  "sectionCancelled",
];

/**
 * What a read-only term still answers. Default-deny: anything not named here
 * is a write, whatever route it arrives by.
 *
 * `pressedMeeting` and `released` are on the list because together they are
 * how the week grid selects a block. A press alone changes no data, and with
 * `pointerMoved` refused it can never become a drag, so the release that
 * follows can only ever select.
 */
const READING_EVENTS: EditorEvent["type"][] = [
  "pressedMeeting",
  "released",
  // bookkeeping, not an edit: it only drops an overlay the server already
  // holds, and a term that locked mid-save still has to be able to let go
  "sectionEditsPersisted",
  "canceled",
  "deselected",
  "selectedSection",
  "selectedHour",
  "selectedLeave",
  // nothing was ever written, so there is nothing a locked term protects
  "newSectionDiscarded",
  "filterValuesAdded",
  "filterValuesRemoved",
  "filtersCleared",
  "importedSectionsShown",
  // both only drop what the banner held, which a locked term still has to do
  "importDismissed",
  "importUndone",
  "viewSelected",
  "daySelected",
  "filterPanelOverridden",
  // a term that locked mid-save still has to show and drop what came back
  "writeRefused",
  "writeErrorDismissed",
  "deleteCancelled",
  "asyncDayShown",
  "urlChanged",
  "dismissalCancelled",
  // leaving a locked term still has to drop what was held for it
  "contextChanged",
];

export function update(
  state: EditorState,
  event: EditorEvent,
  context: ScheduleContext,
): Next {
  if (context.isReadOnly && !READING_EVENTS.includes(event.type)) {
    return { state, effects: [] };
  }

  if (event.type === "dismissalCancelled" || state.pendingDismissal !== null) {
    return answeringDismissal(state, event, context);
  }

  const nextState = withoutSupersededImport(
    event,
    withoutAbandonedSection(state, reduce(state, event, context)),
  );

  // Held rather than applied: the view asks, and the answer comes back as its
  // own event. Nothing impure happens here, and nothing is lost meanwhile.
  if (
    !DISCARDS_ON_PURPOSE.includes(event.type) &&
    selectAbandonsUnsavedWork(state, nextState, context)
  ) {
    return {
      state: {
        ...state,
        interaction: { status: "idle" },
        pendingDismissal: { event, interaction: state.interaction },
      },
      effects: [],
    };
  }

  const settled = SHEET_MOVED_ON.includes(event.type)
    ? { ...nextState, writeError: null, isConfirmingDelete: false }
    : nextState;

  return {
    state: settled,
    effects: effectsOf(event, state, settled),
  };
}

/**
 * While a question is on screen the only events that mean anything are its
 * answers. Confirming drops the edits before replaying the held event, so the
 * replay cannot ask the same question again.
 */
function answeringDismissal(
  state: EditorState,
  event: EditorEvent,
  context: ScheduleContext,
): Next {
  const held = state.pendingDismissal;

  if (event.type === "dismissalConfirmed" && held) {
    const open = selectOpenSectionId(state);

    return update(
      {
        ...state,
        pendingDismissal: null,
        interaction: held.interaction,
        drafts: open === null ? state.drafts : omitKey(state.drafts, open),
      },
      held.event,
      context,
    );
  }

  // Escape answers it too, and answers it the safe way
  const isAnswer =
    event.type === "dismissalCancelled" || event.type === "canceled";
  if (!isAnswer) return { state, effects: [] };

  const kept = { ...state, pendingDismissal: null };

  // Drop this and "Keep editing" after a back button leaves the address bar
  // naming the section the reader was heading for, not the one still open.
  return {
    state: kept,
    effects:
      held?.event.type === "urlChanged"
        ? [{ type: "replaceUrlQuery", query: urlQueryOf(kept) }]
        : [],
  };
}

/**
 * Writes that leave the banner's Undo unsafe to press. Undo deletes the
 * sections the import made, so once the server holds an edit to one of them,
 * pressing it would delete that edit too.
 */
const SUPERSEDES_IMPORT: EditorEvent["type"][] = [
  "sectionCreated",
  "sectionDeleted",
  "sectionEditsPersisted",
];

function withoutSupersededImport(
  event: EditorEvent,
  state: EditorState,
): EditorState {
  return state.lastImport !== null && SUPERSEDES_IMPORT.includes(event.type)
    ? { ...state, lastImport: null }
    : state;
}

/**
 * The sheet's unsaved form goes when the selection leaves the section it
 * belongs to: Escape, a click on another block, a chip, an hour. A section
 * drawn but never created goes with it, since its draft is the whole of it.
 *
 * Keyed on which section is open rather than on what the event was, so that
 * editing a section's own days and times, which renames its blocks, does not
 * read as walking away from it. The shell asks first where the edits are worth
 * keeping; see `selectAbandonsUnsavedWork`.
 */
function withoutAbandonedSection(
  before: EditorState,
  after: EditorState,
): EditorState {
  const left = selectOpenSectionId(before);
  if (left === null || selectOpenSectionId(after) === left) return after;
  if (after.drafts[left] === undefined) return after;

  return { ...after, drafts: omitKey(after.drafts, left) };
}

/**
 * The URL is rewritten whenever it would now say something different, and only
 * then. That covers the whole loop guard between the page and the router:
 * `urlChanged` is the one event that writes URL-backed state, and it raises no
 * effect of its own, so a round trip always ends after a single pass.
 */
function effectsOf(
  event: EditorEvent,
  before: EditorState,
  after: EditorState,
): Effect[] {
  if (event.type === "urlChanged") return [];

  // `contextChanged` is raised from a route guard, so the navigation carrying
  // the new term has not committed yet. Let it through and `router.replace`
  // runs against the term being left, which cancels the move: the reader picks
  // a new term and stays on the old one's sections. The navigation is writing
  // the query itself, so there is nothing here to write.
  if (event.type === "contextChanged") return [];

  const query = urlQueryOf(after);

  return isEqual(query, urlQueryOf(before))
    ? []
    : [{ type: "replaceUrlQuery", query }];
}

/**
 * The whole of what a link to this page carries. Written in one piece rather
 * than a key at a time, so no two writes can race and leave the day naming a
 * tab the view is not on.
 */
function urlQueryOf(state: EditorState): UrlQuery {
  return {
    ...encodeFilters(state.filters),
    ...encodeSelection(state.selection),
    view: state.view,
    // The day list shows one day at a time, so a link to it has to say which.
    // No other view has a day to name.
    ...(state.view === "day" ? { day: encodeDayIndex(state.dayIndex) } : {}),
  };
}

/**
 * Whether a selection read back out of the URL is the one already held. A
 * selected grid block encodes as the section it belongs to, so the query the
 * page just wrote for a block reads back as a plain section selection.
 * Comparing the encodings rather than the selections is what keeps the block
 * itself marked instead of every block its section has.
 */
function namesHeldSelection(
  state: EditorState,
  fromUrl: EditorState["selection"],
): boolean {
  return isEqual(encodeSelection(state.selection), encodeSelection(fromUrl));
}

function reduce(
  state: EditorState,
  event: EditorEvent,
  context: ScheduleContext,
): EditorState {
  switch (event.type) {
    case "pressedEmptySpace": {
      const minute = snapToGrid(event.minute);
      return {
        ...state,
        lastPlacedId: null,
        interaction: {
          status: "drawing",
          dayIndex: event.dayIndex,
          anchorMinute: minute,
          startMinute: minute,
          endMinute: minute,
        },
      };
    }

    // against the schedule as drawn, so an
    // already-moved meeting is grabbed where it is
    case "pressedMeeting": {
      const meeting = selectMeetings(context, state).find(
        ({ id }) => id === event.meetingId,
      );
      if (!meeting) return state;

      return {
        ...state,
        lastPlacedId: null,
        interaction: {
          status: "pressed",
          meetingId: meeting.id,
          grabbedAfterStart: event.minute - meeting.startMinute,
          dayIndex: meeting.dayIndex,
          minute: event.minute,
        },
      };
    }

    case "pressedMeetingEdge": {
      const meeting = selectMeetings(context, state).find(
        ({ id }) => id === event.meetingId,
      );
      if (!meeting) return state;

      return {
        ...state,
        lastPlacedId: null,
        interaction: {
          status: "resizing",
          meetingId: meeting.id,
          edge: event.edge,
          dayIndex: meeting.dayIndex,
          startMinute: meeting.startMinute,
          endMinute: meeting.endMinute,
        },
      };
    }

    case "pointerMoved":
      return pointerMoved(state, event.dayIndex, event.minute, context);

    case "released":
      return commit(state, context);

    case "canceled":
      return state.interaction.status === "idle"
        ? { ...state, selection: null }
        : toIdle(state);

    case "deselected":
      return { ...state, selection: null };

    case "selectedSection":
      return {
        ...state,
        selection: {
          kind: "section",
          sectionId: event.sectionId,
          ...(event.from ? { from: event.from } : {}),
        },
      };

    case "selectedHour":
      return {
        ...state,
        selection: {
          kind: "hour",
          dayIndex: event.dayIndex,
          startMinute: event.startMinute,
        },
      };

    case "selectedLeave":
      return {
        ...state,
        selection: { kind: "leave", leaveId: event.leaveId },
      };

    case "filterValuesAdded":
      return withFacet(state, event.facet, (checked) => [
        ...checked,
        ...event.values.filter((value) => !checked.includes(value)),
      ]);

    case "filterValuesRemoved":
      return withFacet(state, event.facet, (checked) =>
        checked.filter((value) => !event.values.includes(value)),
      );

    case "filtersCleared":
      return { ...state, filters: emptyFilters() };

    case "importedSectionsShown":
      return {
        ...state,
        filters: { ...emptyFilters(), section: event.sectionIds.map(String) },
      };

    // The filters go so that the sections that just arrived are all on screen;
    // a course checked before the import would hide most of them.
    case "sectionsImported":
      return {
        ...state,
        filters: emptyFilters(),
        lastImport: {
          sectionIds: event.sectionIds,
          sourceTermName: event.sourceTermName,
        },
      };

    // Everything still naming those sections goes with them: the `section`
    // filter "Show these" wrote, which would otherwise hold the canvas empty
    // behind a badge, and a sheet open on one of them.
    case "importUndone": {
      const undoneIds = state.lastImport?.sectionIds ?? [];
      const undoneValues = undoneIds.map(String);
      const open = selectOpenSectionId(state);

      const cleared = undoneIds.reduce(
        (next, sectionId) =>
          withoutEntry(withoutDraft(next, sectionId), sectionId),
        state,
      );

      return {
        ...withFacet(cleared, "section", (checked) =>
          checked.filter((value) => !undoneValues.includes(value)),
        ),
        lastImport: null,
        selection:
          open !== null && undoneIds.includes(open) ? null : state.selection,
      };
    }

    case "importDismissed":
      return { ...state, lastImport: null };

    case "viewSelected":
      return { ...state, view: event.view };

    case "daySelected":
      return { ...state, dayIndex: event.dayIndex };

    case "asyncDayShown":
      return { ...state, view: "day", dayIndex: ASYNC_DAY_INDEX };

    case "urlChanged": {
      const fromUrl = decodeSelection(event.query);

      return {
        ...state,
        view: decodeView(event.query),
        // A URL that names no day is not asking for a particular one, so the
        // tab a scheduler last opened stays open under a view that has no day
        // to name.
        dayIndex: decodeDayIndex(event.query) ?? state.dayIndex,
        filters: decodeFilters(event.query),
        selection: namesHeldSelection(state, fromUrl)
          ? state.selection
          : fromUrl,
      };
    }

    // Everything keyed by a section id, and the drawn section with it. The
    // view, the day and the filters are in the URL, which the toolbar rewrites
    // for the department it is moving to.
    case "contextChanged":
      return {
        ...state,
        sectionEdits: {},
        drafts: {},
        selection: null,
        lastPlacedId: null,
        interaction: { status: "idle" },
        pendingDismissal: null,
        // Undo would send this term's ids to the term now on screen, where
        // they match nothing: a 204 and a banner that clears as if it worked.
        lastImport: null,
      };

    case "sectionFieldEdited":
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [event.sectionId]: {
            ...state.drafts[event.sectionId],
            ...event.change,
          },
        },
      };

    case "draftSaved": {
      const saved = {
        ...state.sectionEdits[event.sectionId],
        ...state.drafts[event.sectionId],
      };

      // "Add meeting time" makes overlaps easy to create; saving merges them
      const edit = saved.meetings
        ? { ...saved, meetings: withoutOverlaps(saved.meetings) }
        : saved;

      return keepingSelection(
        {
          ...withoutDraft(state, event.sectionId),
          sectionEdits: { ...state.sectionEdits, [event.sectionId]: edit },
        },
        context,
        event.sectionId,
        edit.meetings,
      );
    }

    case "meetingDayToggled":
      return withDraftPatterns(state, context, event.sectionId, (patterns) =>
        withDayToggled(patterns, event.patternIndex, event.day),
      );

    case "meetingTimeEdited":
      return withDraftPatterns(state, context, event.sectionId, (patterns) =>
        withTimes(patterns, event.patternIndex, {
          ...(event.startTime ? { startTime: event.startTime } : {}),
          ...(event.endTime ? { endTime: event.endTime } : {}),
        }),
      );

    case "meetingPatternAdded":
      return withDraftPatterns(state, context, event.sectionId, (patterns) => [
        ...patterns,
        { ...DEFAULT_PATTERN, days: ["mon"] },
      ]);

    case "meetingPatternRemoved":
      return withDraftPatterns(state, context, event.sectionId, (patterns) =>
        patterns.filter((_, index) => index !== event.patternIndex),
      );

    case "madeAsynchronous":
      return withDraftPatterns(state, context, event.sectionId, () => []);

    case "draftCancelled":
      return withoutDraft(state, event.sectionId);

    // Straight into the saved edits rather than the draft: the sheet has
    // already asked, so there is nothing left for Save to confirm. The
    // half-typed form goes with it, since none of it can apply now.
    case "sectionCancelled":
      return {
        ...withoutDraft(state, event.sectionId),
        sectionEdits: {
          ...state.sectionEdits,
          [event.sectionId]: {
            ...state.sectionEdits[event.sectionId],
            isCancelled: true,
          },
        },
      };

    case "sectionEditsReverted":
      return withoutEntry(
        withoutDraft(state, event.sectionId),
        event.sectionId,
      );

    case "sectionEditsPersisted":
      // a newer edit made while the save was in flight is not the one that
      // was saved, so it stays and will be saved in its turn
      return isEqual(state.sectionEdits[event.sectionId], event.saved)
        ? withoutEntry(state, event.sectionId)
        : state;

    case "sectionCreated":
      return {
        ...withoutDraft(state, NEW_SECTION_ID),
        selection: { kind: "section", sectionId: event.sectionId },
      };

    case "sectionCreationRequested":
      return {
        ...state,
        drafts: {
          ...state.drafts,
          // Keeping what is there makes a second press a no-op. Writing `{}`
          // instead wipes the times off a rectangle already drawn out, and
          // "keeps the times of a rectangle already drawn out" fails.
          [NEW_SECTION_ID]: state.drafts[NEW_SECTION_ID] ?? {},
        },
        selection: { kind: "section", sectionId: NEW_SECTION_ID },
      };

    case "newSectionDiscarded":
      return { ...withoutDraft(state, NEW_SECTION_ID), selection: null };

    case "writeRefused":
      return { ...state, writeError: event.message };

    case "writeErrorDismissed":
      return { ...state, writeError: null };

    case "deleteRequested":
      return { ...state, isConfirmingDelete: true };

    case "deleteCancelled":
      return { ...state, isConfirmingDelete: false };

    case "filterPanelOverridden":
      return { ...state, filterPanelOverride: event.isOpen };

    // answered in `update`, which never lets them reach here
    case "dismissalConfirmed":
    case "dismissalCancelled":
      return state;

    case "sectionDeleted":
      return {
        ...withoutEntry(withoutDraft(state, event.sectionId), event.sectionId),
        selection: null,
      };

    // Filters go too. A `section` filter names ids the term no longer has, so
    // the canvas would stay empty through the next import as well.
    case "allSectionsDeleted":
      return {
        ...state,
        sectionEdits: {},
        drafts: {},
        selection: null,
        filters: emptyFilters(),
        lastImport: null,
      };

    default:
      return assertNever(event);
  }
}

/**
 * Blocks are named for where they sit, so a save can rename the selected
 * one; reselect the section's first block, or the section itself if none.
 */
function keepingSelection(
  state: EditorState,
  context: ScheduleContext,
  sectionId: number,
  meetings: SisSectionMeeting[] | undefined,
): EditorState {
  const { selection } = state;
  if (!meetings || selection?.kind !== "meeting") return state;

  const wasThisSection =
    sectionIdOfMeetingId(selection.meetingId) === sectionId;
  if (!wasThisSection) return state;

  const ids = meetings.flatMap((pattern) =>
    pattern.days.map((day) => meetingIdOf(sectionId, day, pattern.startTime)),
  );
  if (ids.includes(selection.meetingId)) return state;

  return {
    ...state,
    selection:
      ids.length > 0
        ? { kind: "meeting", meetingId: ids[0] }
        : { kind: "section", sectionId },
  };
}

function withDraftPatterns(
  state: EditorState,
  context: ScheduleContext,
  sectionId: number,
  change: (patterns: SisSectionMeeting[]) => SisSectionMeeting[],
): EditorState {
  const section = selectLocalSections(context, state).find(
    ({ id }) => id === sectionId,
  );
  const draft = state.drafts[sectionId];
  const patterns = draft?.meetings ?? section?.meetings;
  if (!patterns) return state;

  return {
    ...state,
    drafts: {
      ...state.drafts,
      [sectionId]: { ...draft, meetings: change(patterns) },
    },
  };
}

const withoutDraft = (state: EditorState, sectionId: number): EditorState => ({
  ...state,
  drafts: omitKey(state.drafts, sectionId),
});

const withoutEntry = (state: EditorState, sectionId: number): EditorState => ({
  ...state,
  sectionEdits: omitKey(state.sectionEdits, sectionId),
});

const omitKey = <T>(record: Record<number, T>, key: number) =>
  Object.fromEntries(
    Object.entries(record).filter(([held]) => Number(held) !== key),
  );

function withFacet(
  state: EditorState,
  facet: FilterFacet,
  change: (checked: string[]) => string[],
): EditorState {
  return {
    ...state,
    filters: { ...state.filters, [facet]: change(state.filters[facet]) },
  };
}

function pointerMoved(
  state: EditorState,
  dayIndex: number,
  minute: number,
  context: ScheduleContext,
): EditorState {
  const { interaction } = state;

  switch (interaction.status) {
    case "idle":
      return state;

    case "drawing": {
      const snapped = snapToGrid(minute);
      return {
        ...state,
        interaction: {
          ...interaction,
          startMinute: Math.min(interaction.anchorMinute, snapped),
          endMinute: Math.max(interaction.anchorMinute, snapped),
        },
      };
    }

    // past the drag-start distance, promote to `moving` and re-run this event
    case "pressed": {
      const hasLeftPress =
        dayIndex !== interaction.dayIndex ||
        Math.abs(minute - interaction.minute) >= DRAG_START_MINUTES;
      if (!hasLeftPress) return state;

      const meeting = selectMeetings(context, state).find(
        ({ id }) => id === interaction.meetingId,
      );
      if (!meeting) return state;

      return pointerMoved(
        {
          ...state,
          interaction: {
            status: "moving",
            meetingId: interaction.meetingId,
            grabbedAfterStart: interaction.grabbedAfterStart,
            dayIndex: interaction.dayIndex,
            startMinute: meeting.startMinute,
            endMinute: meeting.endMinute,
          },
        },
        dayIndex,
        minute,
        context,
      );
    }

    case "moving":
      return {
        ...state,
        interaction: {
          ...interaction,
          dayIndex,
          ...placeWithinDay(
            snapToGrid(minute - interaction.grabbedAfterStart),
            interaction.endMinute - interaction.startMinute,
          ),
        },
      };

    case "resizing":
      return {
        ...state,
        interaction: {
          ...interaction,
          ...dragEdge(interaction, interaction.edge, snapToGrid(minute)),
        },
      };

    default:
      return assertNever(interaction);
  }
}

function commit(state: EditorState, context: ScheduleContext): EditorState {
  const { interaction } = state;

  switch (interaction.status) {
    case "idle":
      return state;

    case "drawing":
      return commitDrawing(state, interaction);

    case "pressed":
      return {
        ...toIdle(state),
        selection: { kind: "meeting", meetingId: interaction.meetingId },
      };

    case "moving":
    case "resizing":
      return withSectionPlacement(
        state,
        interaction.meetingId,
        {
          dayIndex: interaction.dayIndex,
          startMinute: interaction.startMinute,
          endMinute: interaction.endMinute,
        },
        context,
      );

    default:
      return assertNever(interaction);
  }
}

function commitDrawing(
  state: EditorState,
  drawing: Extract<Interaction, { status: "drawing" }>,
): EditorState {
  // a drag shorter than MIN_DURATION is a click; this also keeps every meeting
  // at least MIN_DURATION
  const isClick = drawing.endMinute - drawing.startMinute < MIN_DURATION;
  const range = isClick
    ? placeWithinDay(drawing.startMinute, CLICK_DURATION)
    : { startMinute: drawing.startMinute, endMinute: drawing.endMinute };

  const startTime = clockFromMinutes(range.startMinute);
  const meetings = [
    {
      days: [GRID_DAYS[drawing.dayIndex]],
      startTime,
      endTime: clockFromMinutes(range.endMinute),
    },
  ];

  return {
    ...state,
    // Only the times: drawing again while the sheet is open on an uncreated
    // section is how its times get changed, so the course, the number, and
    // whoever is teaching it all stay put.
    drafts: {
      ...state.drafts,
      [NEW_SECTION_ID]: { ...state.drafts[NEW_SECTION_ID], meetings },
    },
    interaction: { status: "idle" },
    lastPlacedId: meetingIdOf(
      NEW_SECTION_ID,
      GRID_DAYS[drawing.dayIndex],
      startTime,
    ),
    selection: {
      kind: "meeting",
      meetingId: meetingIdOf(
        NEW_SECTION_ID,
        GRID_DAYS[drawing.dayIndex],
        startTime,
      ),
    },
  };
}

/**
 * Moving a block renames it; selection and the drop flash follow the new id.
 *
 * The section being created is moved the same way, except that its times live
 * in its draft rather than in an overlay on a server row, so that is where the
 * new placement is written.
 */
function withSectionPlacement(
  state: EditorState,
  meetingId: string,
  placement: Placement,
  context: ScheduleContext,
): EditorState {
  const beingCreated = selectNewSectionMeetings(state).find(
    ({ id }) => id === meetingId,
  );

  const meeting =
    beingCreated ??
    selectMeetings(context, state).find(({ id }) => id === meetingId);
  const patterns = beingCreated
    ? state.drafts[NEW_SECTION_ID]?.meetings
    : selectLocalSections(context, state).find(
        ({ id }) => id === meeting?.sectionId,
      )?.meetings;

  if (!meeting || !patterns || meeting.sectionId === null) return toIdle(state);

  const sectionId = meeting.sectionId;
  const meetings = withPlacement(
    patterns,
    {
      day: GRID_DAYS[meeting.dayIndex],
      startTime: clockFromMinutes(meeting.startMinute),
    },
    placement,
  );

  const placedId = meetingIdOf(
    sectionId,
    GRID_DAYS[placement.dayIndex],
    clockFromMinutes(placement.startMinute),
  );

  const wasSelected =
    state.selection?.kind === "meeting" &&
    state.selection.meetingId === meetingId;

  const moved = beingCreated
    ? {
        ...state,
        drafts: {
          ...state.drafts,
          [NEW_SECTION_ID]: { ...state.drafts[NEW_SECTION_ID], meetings },
        },
      }
    : {
        ...state,
        sectionEdits: {
          ...state.sectionEdits,
          [sectionId]: { ...state.sectionEdits[sectionId], meetings },
        },
      };

  return {
    ...toIdle(moved),
    lastPlacedId: placedId,
    selection: wasSelected
      ? { kind: "meeting", meetingId: placedId }
      : state.selection,
  };
}

const toIdle = (state: EditorState): EditorState => ({
  ...state,
  interaction: { status: "idle" },
});

function dragEdge(
  range: TimeRange,
  edge: MeetingEdge,
  minute: number,
): TimeRange {
  return edge === "start"
    ? {
        ...range,
        startMinute: clamp(
          minute,
          START_MINUTE,
          range.endMinute - MIN_DURATION,
        ),
      }
    : {
        ...range,
        endMinute: clamp(minute, range.startMinute + MIN_DURATION, END_MINUTE),
      };
}

function placeWithinDay(startMinute: number, duration: number): TimeRange {
  const start = clamp(startMinute, START_MINUTE, END_MINUTE - duration);

  return { startMinute: start, endMinute: start + duration };
}

const clamp = (value: number, lowest: number, highest: number) =>
  Math.min(Math.max(value, lowest), highest);

function assertNever(value: never): never {
  throw new Error(
    `Unhandled case in the schedule editor: ${JSON.stringify(value)}`,
  );
}
