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
 * Nothing here needs to reach the network yet. When saving arrives this grows
 * the shape the asset editor already uses, returning `{ state, effects }` with
 * the effects run outside.
 */

import type { Meeting, TimeRange } from "../types";
import { END_MINUTE, snapToGrid, START_MINUTE } from "../helpers/timeScale";
import { mergeSchedule } from "./mergeSchedule";
import type {
  EditorEvent,
  EditorState,
  Interaction,
  MeetingEdge,
} from "./types";

/** What a press with no drag creates: one standard fifty-minute period. */
const CLICK_DURATION = 50;

/**
 * The shortest a meeting can be. Not a scheduling rule — it keeps the block
 * tall enough to still show its times and to offer an edge to grab, so a
 * meeting can never shrink past the point of being editable.
 */
const MIN_DURATION = 15;

export const initialState = (): EditorState => ({
  drawn: [],
  overrides: {},
  interaction: { status: "idle" },
  nextLocalId: 1,
});

export function update(
  state: EditorState,
  event: EditorEvent,
  base: Meeting[],
): EditorState {
  switch (event.type) {
    case "pressedEmptySpace": {
      const minute = snapToGrid(event.minute);
      return {
        ...state,
        interaction: {
          status: "drawing",
          dayIndex: event.dayIndex,
          anchorMinute: minute,
          startMinute: minute,
          endMinute: minute,
        },
      };
    }

    // Presses land on the merged schedule: a meeting already moved once is
    // grabbed where the user last put it, not where the server has it.
    case "pressedMeeting": {
      const meeting = mergeSchedule(base, state).find(
        ({ id }) => id === event.meetingId,
      );
      if (!meeting) return state;

      return {
        ...state,
        interaction: {
          status: "moving",
          meetingId: meeting.id,
          // Remembering where in the block it was picked up is what stops the
          // meeting jumping so its top sits under the pointer.
          grabbedAfterStart: event.minute - meeting.startMinute,
          dayIndex: meeting.dayIndex,
          startMinute: meeting.startMinute,
          endMinute: meeting.endMinute,
        },
      };
    }

    case "pressedMeetingEdge": {
      const meeting = mergeSchedule(base, state).find(
        ({ id }) => id === event.meetingId,
      );
      if (!meeting) return state;

      return {
        ...state,
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
      return pointerMoved(state, event.dayIndex, event.minute);

    case "released":
      return commit(state);

    case "cancelled":
      return toIdle(state);

    default:
      return assertNever(event);
  }
}

function pointerMoved(
  state: EditorState,
  dayIndex: number,
  minute: number,
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
function commit(state: EditorState): EditorState {
  const { interaction } = state;

  switch (interaction.status) {
    case "idle":
      return state;

    case "drawing":
      return commitDrawing(state, interaction);

    // A meeting drawn here is rewritten in place; one from the server keeps
    // its base row and gains an override.
    case "moving":
    case "resizing": {
      const placement = {
        dayIndex: interaction.dayIndex,
        startMinute: interaction.startMinute,
        endMinute: interaction.endMinute,
      };

      const isDrawn = state.drawn.some(
        ({ id }) => id === interaction.meetingId,
      );
      return isDrawn
        ? {
            ...toIdle(state),
            drawn: state.drawn.map((meeting) =>
              meeting.id === interaction.meetingId
                ? { ...meeting, ...placement }
                : meeting,
            ),
          }
        : {
            ...toIdle(state),
            overrides: {
              ...state.overrides,
              [interaction.meetingId]: placement,
            },
          };
    }

    default:
      return assertNever(interaction);
  }
}

function commitDrawing(
  state: EditorState,
  drawing: Extract<Interaction, { status: "drawing" }>,
): EditorState {
  // A drag too short to make a readable meeting was a click. This is also
  // what keeps every meeting at least MIN_DURATION long, so the resize
  // clamps below can never see a shorter one.
  const isClick = drawing.endMinute - drawing.startMinute < MIN_DURATION;
  const range = isClick
    ? placeWithinDay(drawing.startMinute, CLICK_DURATION)
    : { startMinute: drawing.startMinute, endMinute: drawing.endMinute };

  return {
    ...state,
    drawn: [
      ...state.drawn,
      {
        id: `local-${state.nextLocalId}`,
        dayIndex: drawing.dayIndex,
        ...range,
      },
    ],
    interaction: { status: "idle" },
    nextLocalId: state.nextLocalId + 1,
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
