import { describe, expect, it } from "vitest";
import { initialState, update } from "./update";
import type { Meeting } from "../types";
import type { EditorEvent, EditorState } from "./types";

const after = (
  events: EditorEvent[],
  state: EditorState = initialState(),
  base: Meeting[] = [],
) => events.reduce((current, event) => update(current, event, base), state);

/** A committed meeting drawn out on `dayIndex` from `from` to `to`. */
const draw = (dayIndex: number, from: number, to: number): EditorEvent[] => [
  { type: "pressedEmptySpace", dayIndex, minute: from },
  { type: "pointerMoved", dayIndex, minute: to },
  { type: "released" },
];

describe("drawing", () => {
  it("a click creates one standard period", () => {
    const state = after([
      { type: "pressedEmptySpace", dayIndex: 0, minute: 600 },
      { type: "released" },
    ]);

    expect(state.drawn).toEqual([
      { id: "local-1", dayIndex: 0, startMinute: 600, endMinute: 650 },
    ]);
  });

  it("a drag creates the dragged range", () => {
    const state = after(draw(2, 600, 675));

    expect(state.drawn).toEqual([
      { id: "local-1", dayIndex: 2, startMinute: 600, endMinute: 675 },
    ]);
    expect(state.nextLocalId).toBe(2);
  });

  it("a drag shorter than the minimum duration counts as a click", () => {
    const state = after(draw(0, 600, 610));

    expect(state.drawn[0]).toMatchObject({
      startMinute: 600,
      endMinute: 650,
    });
  });

  it("snaps the fractional minutes the grid measures", () => {
    const state = after(draw(0, 601.4, 658.2));

    expect(state.drawn[0]).toMatchObject({
      startMinute: 600,
      endMinute: 660,
    });
  });

  it("cancelling discards the draft", () => {
    const state = after([
      { type: "pressedEmptySpace", dayIndex: 0, minute: 600 },
      { type: "pointerMoved", dayIndex: 0, minute: 700 },
      { type: "cancelled" },
    ]);

    expect(state.drawn).toEqual([]);
    expect(state.interaction).toEqual({ status: "idle" });
  });
});

describe("moving", () => {
  const oneMeeting = after(draw(0, 540, 590));
  const grabbed: EditorEvent[] = [
    { type: "pressedMeeting", meetingId: "local-1", minute: 550 },
    { type: "pointerMoved", dayIndex: 2, minute: 710 },
  ];

  it("leaves the schedule untouched until release", () => {
    const state = after(grabbed, oneMeeting);

    expect(state.drawn).toEqual(oneMeeting.drawn);
    expect(state.interaction).toMatchObject({
      status: "moving",
      dayIndex: 2,
      startMinute: 700,
      endMinute: 750,
    });
  });

  it("release commits the draft's day and range", () => {
    const state = after([...grabbed, { type: "released" }], oneMeeting);

    expect(state.drawn).toEqual([
      { id: "local-1", dayIndex: 2, startMinute: 700, endMinute: 750 },
    ]);
    expect(state.interaction).toEqual({ status: "idle" });
  });

  it("cancel reverts to where the meeting was", () => {
    const state = after([...grabbed, { type: "cancelled" }], oneMeeting);

    expect(state.drawn).toEqual(oneMeeting.drawn);
    expect(state.interaction).toEqual({ status: "idle" });
  });

  it("keeps the whole meeting inside the day's hours", () => {
    const state = after(
      [
        { type: "pressedMeeting", meetingId: "local-1", minute: 550 },
        { type: "pointerMoved", dayIndex: 0, minute: 1255 },
        { type: "released" },
      ],
      oneMeeting,
    );

    expect(state.drawn[0]).toMatchObject({
      startMinute: 1210,
      endMinute: 1260,
    });
  });
});

describe("resizing", () => {
  const oneMeeting = after(draw(1, 540, 590));

  it("release commits the dragged edge", () => {
    const state = after(
      [
        {
          type: "pressedMeetingEdge",
          meetingId: "local-1",
          edge: "end",
          minute: 590,
        },
        { type: "pointerMoved", dayIndex: 1, minute: 645 },
        { type: "released" },
      ],
      oneMeeting,
    );

    expect(state.drawn).toEqual([
      { id: "local-1", dayIndex: 1, startMinute: 540, endMinute: 645 },
    ]);
  });

  it("cancel reverts to the original length", () => {
    const state = after(
      [
        {
          type: "pressedMeetingEdge",
          meetingId: "local-1",
          edge: "end",
          minute: 590,
        },
        { type: "pointerMoved", dayIndex: 1, minute: 645 },
        { type: "cancelled" },
      ],
      oneMeeting,
    );

    expect(state.drawn).toEqual(oneMeeting.drawn);
  });

  it("the two ends cannot cross", () => {
    const state = after(
      [
        {
          type: "pressedMeetingEdge",
          meetingId: "local-1",
          edge: "end",
          minute: 590,
        },
        { type: "pointerMoved", dayIndex: 1, minute: 500 },
        { type: "released" },
      ],
      oneMeeting,
    );

    expect(state.drawn[0]).toMatchObject({
      startMinute: 540,
      endMinute: 555,
    });
  });

  it("the day's start bound holds", () => {
    const first = after(draw(0, 480, 530));
    const state = after(
      [
        {
          type: "pressedMeetingEdge",
          meetingId: "local-1",
          edge: "start",
          minute: 480,
        },
        { type: "pointerMoved", dayIndex: 0, minute: 400 },
        { type: "released" },
      ],
      first,
    );

    expect(state.drawn[0]).toMatchObject({
      startMinute: 480,
      endMinute: 530,
    });
  });
});

describe("naming the meeting a gesture placed", () => {
  it("a drawn meeting is named on release", () => {
    expect(after(draw(0, 600, 675)).lastPlacedId).toBe("local-1");
  });

  it("the next press clears it, so a second drop flashes again", () => {
    const drawn = after(draw(0, 600, 675));
    const pressed = after(
      [{ type: "pressedMeeting", meetingId: "local-1", minute: 610 }],
      drawn,
    );

    expect(pressed.lastPlacedId).toBeNull();
    expect(after([{ type: "released" }], pressed).lastPlacedId).toBe("local-1");
  });

  it("a cancelled gesture places nothing", () => {
    const state = after([
      { type: "pressedEmptySpace", dayIndex: 0, minute: 600 },
      { type: "pointerMoved", dayIndex: 0, minute: 700 },
      { type: "cancelled" },
    ]);

    expect(state.lastPlacedId).toBeNull();
  });
});

describe("editing the server's schedule", () => {
  const base: Meeting[] = [
    { id: "s1:0:mon", dayIndex: 0, startMinute: 540, endMinute: 590 },
  ];

  const move = (toDay: number, toMinute: number): EditorEvent[] => [
    { type: "pressedMeeting", meetingId: "s1:0:mon", minute: 550 },
    { type: "pointerMoved", dayIndex: toDay, minute: toMinute },
    { type: "released" },
  ];

  it("moving a base meeting writes an override, not a drawn meeting", () => {
    const state = after(move(2, 710), initialState(), base);

    expect(state.drawn).toEqual([]);
    expect(state.overrides).toEqual({
      "s1:0:mon": { dayIndex: 2, startMinute: 700, endMinute: 750 },
    });
  });

  it("a second grab picks the meeting up where the user last put it", () => {
    const moved = after(move(2, 710), initialState(), base);
    const state = after(
      [
        // A press with no drag: the commit re-writes the current placement.
        { type: "pressedMeeting", meetingId: "s1:0:mon", minute: 710 },
        { type: "released" },
      ],
      moved,
      base,
    );

    expect(state.overrides["s1:0:mon"]).toMatchObject({
      dayIndex: 2,
      startMinute: 700,
      endMinute: 750,
    });
  });

  it("resizing a base meeting also lands in the overrides", () => {
    const state = after(
      [
        {
          type: "pressedMeetingEdge",
          meetingId: "s1:0:mon",
          edge: "end",
          minute: 590,
        },
        { type: "pointerMoved", dayIndex: 0, minute: 645 },
        { type: "released" },
      ],
      initialState(),
      base,
    );

    expect(state.overrides).toEqual({
      "s1:0:mon": { dayIndex: 0, startMinute: 540, endMinute: 645 },
    });
  });
});
