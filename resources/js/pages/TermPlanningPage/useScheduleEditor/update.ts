/**
 * The engine: the only thing that writes editor state.
 *
 * Pure — no DOM, no clock, no randomness — so every rule about what a gesture
 * means can be read, and tested, without a browser.
 *
 * The schedule does not change until a gesture ends: `pointerMoved` writes
 * only the interaction's draft, and `released` is the one place the edits
 * are written.
 *
 * `base` is the server's schedule, passed in rather than held here, so the
 * state carries only what this browser changed. It is context, not state:
 * `update` reads it to find the meeting under a press, and never writes it.
 *
 * `update` returns `{ state, effects }`, the shape the asset editor uses:
 * `reduce` decides the next state, `effectsOf` decides what should happen
 * outside as a result, and `useScheduleEditor` runs those effects. Nothing
 * here reaches the network yet; the URL is the only effect so far.
 */

import type { FilterFacet, ScheduleFilters, TimeRange } from "../types";
import {
  clockFromMinutes,
  END_MINUTE,
  snapToGrid,
  START_MINUTE,
} from "../helpers/timeScale";
import { GRID_DAYS, meetingIdOf } from "../helpers/sectionPlacement";
import { withPlacement } from "./meetingPatterns";
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

/**
 * The shortest a meeting can be. Not a scheduling rule — it keeps the block
 * tall enough to still show its times and to offer an edge to grab, so a
 * meeting can never shrink past the point of being editable.
 */
const MIN_DURATION = 15;

/**
 * How far a pressed block must be dragged before it is carried, in the
 * grid's minutes because that is the unit the grid reports. At the current
 * scale one minute is one pixel, so this is an ordinary drag-start
 * distance. Below it a wavering hand is still a click.
 */
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

/**
 * The user changing a filter is what the URL should follow. A filter that
 * arrived from the URL is already there, so echoing it back would only set
 * the two sides chasing each other.
 */
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

    // Presses land on the schedule as drawn: a meeting already moved once is
    // grabbed where the user last put it, not where the server has it.
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
          // Remembering where in the block it was picked up is what stops the
          // meeting jumping so its top sits under the pointer once carried.
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

    // Mid-gesture this is a plain discard; at rest there is no gesture to
    // discard, so Escape clears the selection instead.
    case "cancelled":
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

    // The draft is stated in full, so saving is a plain merge: a field the
    // form never touched keeps whatever the section already said.
    case "draftSaved":
      return {
        ...withoutDraft(state, event.sectionId),
        sectionEdits: {
          ...state.sectionEdits,
          [event.sectionId]: {
            ...state.sectionEdits[event.sectionId],
            ...state.drafts[event.sectionId],
          },
        },
      };

    case "draftCancelled":
      return withoutDraft(state, event.sectionId);

    // Both go: the section reads as the SIS has it, and a form still open
    // over it would put the edits straight back.
    case "sectionEditsReverted":
      return withoutEntry(
        withoutDraft(state, event.sectionId),
        event.sectionId,
      );

    default:
      return assertNever(event);
  }
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

/** Rewrites one facet's checked values and leaves the other facets alone. */
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

    // A new meeting stays in the day it began in, so a wavering hand cannot
    // smear one across the week. Only its time follows the pointer.
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

    // A click still under the drag-start distance stays a press; apply the
    // same move once it clears the threshold, by promoting to `moving` and
    // running this event again so the carrying logic below is not repeated.
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

    // Dragging an edge changes the length, so the meeting stays in its day
    // however far sideways the pointer wanders.
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

/** The one writer of the edits: a gesture's draft becomes the schedule. */
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

    // Never carried past the drag-start distance, so releasing here is a
    // click: it selects the meeting instead of writing a placement.
    case "pressed":
      return {
        ...toIdle(state),
        selection: { kind: "meeting", meetingId: interaction.meetingId },
      };

    // Moving and resizing both write the gesture's draft. A placeholder time
    // is rewritten in place; a section's block becomes a rewrite of that
    // section's patterns, which is the one place the schedule says when a
    // section meets.
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
  // A drag too short to make a readable meeting was a click. This is also
  // what keeps every meeting at least MIN_DURATION long, so the resize
  // clamps below can never see a shorter one.
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
 * A dropped block, written as its section's patterns. The block's name says
 * where it sits, so moving it renames it, and the selection and the drop
 * flash are carried over to the new name.
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

/**
 * Moves one end of a meeting and leaves the other where it is. The two ends
 * cannot meet or cross: a meeting always keeps enough height to be read and
 * to be grabbed again.
 */
function dragEdge(
  range: TimeRange,
  edge: MeetingEdge,
  minute: number,
): TimeRange {
  // The bounds cannot invert: no meeting is shorter than MIN_DURATION, so
  // endMinute - MIN_DURATION never falls before the start of the day.
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

/**
 * Keeps a whole meeting inside the hours the grid draws. Clamping the start
 * alone would let a long meeting's tail slide off the bottom.
 */
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
