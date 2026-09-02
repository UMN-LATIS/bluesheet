/**
 * The only writer of editor state. Pure: no DOM, clock, or randomness.
 * Gestures write only their draft until `released` commits.
 */

import type {
  FilterFacet,
  ScheduleFilters,
  SisSectionMeeting,
  TimeRange,
} from "../types";
import {
  clockFromMinutes,
  END_MINUTE,
  snapToGrid,
  START_MINUTE,
} from "../helpers/timeScale";
import { GRID_DAYS, meetingIdOf } from "../helpers/sectionPlacement";
import {
  DEFAULT_PATTERN,
  withDayToggled,
  withoutOverlaps,
  withPlacement,
  withTimes,
} from "./meetingPatterns";
import { selectMeetings } from "./selectors";
import type {
  EditorDeps,
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

export const initialState = (): EditorState => ({
  placeholderMeetings: [],
  sectionEdits: {},
  drafts: {},
  interaction: { status: "idle" },
  lastPlacedId: null,
  selection: null,
  filters: emptyFilters(),
});

export function update(
  state: EditorState,
  event: EditorEvent,
  context: ScheduleContext,
  deps: EditorDeps,
): Next {
  const nextState = reduce(state, event, context, deps);

  return { state: nextState, effects: effectsOf(event, nextState) };
}

// only user-made changes sync to the URL;
// echoing `filtersReplaced` back would loop
function effectsOf(event: EditorEvent, state: EditorState): Effect[] {
  switch (event.type) {
    case "filterValuesAdded":
    case "filterValuesRemoved":
    case "filtersCleared":
      return [{ type: "syncFiltersToUrl", filters: state.filters }];

    default:
      return [];
  }
}

function reduce(
  state: EditorState,
  event: EditorEvent,
  context: ScheduleContext,
  deps: EditorDeps,
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
      return commit(state, context, deps);

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

    case "filtersReplaced":
      return { ...state, filters: event.filters };

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

    case "sectionEditsReverted":
      return withoutEntry(
        withoutDraft(state, event.sectionId),
        event.sectionId,
      );

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
    context.meetings.find(({ id }) => id === selection.meetingId)?.sectionId ===
    sectionId;
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
  const section = context.sections.find(({ id }) => id === sectionId);
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

function commit(
  state: EditorState,
  context: ScheduleContext,
  deps: EditorDeps,
): EditorState {
  const { interaction } = state;

  switch (interaction.status) {
    case "idle":
      return state;

    case "drawing":
      return commitDrawing(state, interaction, deps);

    case "pressed":
      return {
        ...toIdle(state),
        selection: { kind: "meeting", meetingId: interaction.meetingId },
      };

    case "moving":
    case "resizing": {
      const placement = {
        dayIndex: interaction.dayIndex,
        startMinute: interaction.startMinute,
        endMinute: interaction.endMinute,
      };

      const isPlaceholder = state.placeholderMeetings.some(
        ({ id }) => id === interaction.meetingId,
      );

      return isPlaceholder
        ? {
            ...toIdle(state),
            lastPlacedId: interaction.meetingId,
            placeholderMeetings: state.placeholderMeetings.map((meeting) =>
              meeting.id === interaction.meetingId
                ? { ...meeting, ...placement }
                : meeting,
            ),
          }
        : withSectionPlacement(
            state,
            interaction.meetingId,
            placement,
            context,
          );
    }

    default:
      return assertNever(interaction);
  }
}

function commitDrawing(
  state: EditorState,
  drawing: Extract<Interaction, { status: "drawing" }>,
  deps: EditorDeps,
): EditorState {
  // a drag shorter than MIN_DURATION is a click; this also keeps every meeting
  // at least MIN_DURATION
  const isClick = drawing.endMinute - drawing.startMinute < MIN_DURATION;
  const range = isClick
    ? placeWithinDay(drawing.startMinute, CLICK_DURATION)
    : { startMinute: drawing.startMinute, endMinute: drawing.endMinute };

  const id = deps.createUuid();

  return {
    ...state,
    placeholderMeetings: [
      ...state.placeholderMeetings,
      { id, dayIndex: drawing.dayIndex, sectionId: null, ...range },
    ],
    interaction: { status: "idle" },
    lastPlacedId: id,
  };
}

/**
 * Moving a block renames it; selection and the drop flash follow the new id.
 */
function withSectionPlacement(
  state: EditorState,
  meetingId: string,
  placement: Placement,
  context: ScheduleContext,
): EditorState {
  const meeting = context.meetings.find(({ id }) => id === meetingId);
  const section = context.sections.find(({ id }) => id === meeting?.sectionId);
  if (!meeting || !section) return toIdle(state);

  const meetings = withPlacement(
    section.meetings,
    {
      day: GRID_DAYS[meeting.dayIndex],
      startTime: clockFromMinutes(meeting.startMinute),
    },
    placement,
  );

  const placedId = meetingIdOf(
    section.id,
    GRID_DAYS[placement.dayIndex],
    clockFromMinutes(placement.startMinute),
  );

  const wasSelected =
    state.selection?.kind === "meeting" &&
    state.selection.meetingId === meetingId;

  return {
    ...toIdle(state),
    sectionEdits: {
      ...state.sectionEdits,
      [section.id]: { ...state.sectionEdits[section.id], meetings },
    },
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
