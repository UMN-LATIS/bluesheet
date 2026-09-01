/**
 * The engine: the only thing that writes editor state.
 *
 * Pure — no DOM, no clock, no randomness — so every rule about what a gesture
 * means can be read, and tested, without a browser.
 *
 * Nothing here needs to reach the network yet. When saving arrives this grows
 * the shape the asset editor already uses, returning `{ state, effects }` with
 * the effects run outside.
 */

import type { TimeRange } from "../types";
import { END_MINUTE, SNAP_MINUTES, START_MINUTE } from "../helpers/timeScale";
import type { EditorEvent, EditorState, Interaction } from "./types";

/** What a press with no drag creates: one standard fifty-minute period. */
const CLICK_DURATION = 50;

export const initialState = (): EditorState => ({
  meetings: [],
  interaction: { status: "idle" },
  nextLocalId: 1,
});

export function update(state: EditorState, event: EditorEvent): EditorState {
  switch (event.type) {
    case "pressedEmptySpace":
      return {
        ...state,
        interaction: {
          status: "drawing",
          dayIndex: event.dayIndex,
          anchorMinute: event.minute,
          startMinute: event.minute,
          endMinute: event.minute,
        },
      };

    case "pressedMeeting": {
      const meeting = state.meetings.find(({ id }) => id === event.meetingId);
      if (!meeting) return state;

      return {
        ...state,
        interaction: {
          status: "moving",
          meetingId: meeting.id,
          // Remembering where in the block it was picked up is what stops the
          // meeting jumping so its top sits under the pointer.
          grabbedAfterStart: event.minute - meeting.startMinute,
        },
      };
    }

    case "pointerMoved":
      return pointerMoved(state, event.dayIndex, event.minute);

    case "released":
      return state.interaction.status === "drawing"
        ? commitDrawing(state, state.interaction)
        : toIdle(state);

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
    case "drawing":
      return {
        ...state,
        interaction: {
          ...interaction,
          startMinute: Math.min(interaction.anchorMinute, minute),
          endMinute: Math.max(interaction.anchorMinute, minute),
        },
      };

    case "moving":
      return {
        ...state,
        meetings: state.meetings.map((meeting) =>
          meeting.id === interaction.meetingId
            ? {
                ...meeting,
                dayIndex,
                ...placeWithinDay(
                  minute - interaction.grabbedAfterStart,
                  meeting.endMinute - meeting.startMinute,
                ),
              }
            : meeting,
        ),
      };

    default:
      return assertNever(interaction);
  }
}

function commitDrawing(
  state: EditorState,
  drawing: Extract<Interaction, { status: "drawing" }>,
): EditorState {
  const isClick = drawing.endMinute - drawing.startMinute < SNAP_MINUTES;
  const range = isClick
    ? placeWithinDay(drawing.startMinute, CLICK_DURATION)
    : { startMinute: drawing.startMinute, endMinute: drawing.endMinute };

  if (range.endMinute <= range.startMinute) return toIdle(state);

  return {
    meetings: [
      ...state.meetings,
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
 * Keeps a whole meeting inside the hours the grid draws. Clamping the start
 * alone would let a long meeting's tail slide off the bottom.
 */
function placeWithinDay(startMinute: number, duration: number): TimeRange {
  const start = Math.min(
    Math.max(startMinute, START_MINUTE),
    END_MINUTE - duration,
  );

  return { startMinute: start, endMinute: start + duration };
}

function assertNever(value: never): never {
  throw new Error(
    `Unhandled case in the schedule editor: ${JSON.stringify(value)}`,
  );
}
