import { describe, expect, it } from "vitest";
import { initialState, update } from "./update";
import type { EditorEvent, EditorState } from "./types";

const after = (events: EditorEvent[], state: EditorState = initialState()) =>
  events.reduce(update, state);

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

    expect(state.meetings).toEqual([
      { id: "local-1", dayIndex: 0, startMinute: 600, endMinute: 650 },
    ]);
  });

  it("a drag creates the dragged range", () => {
    const state = after(draw(2, 600, 675));

    expect(state.meetings).toEqual([
      { id: "local-1", dayIndex: 2, startMinute: 600, endMinute: 675 },
    ]);
    expect(state.nextLocalId).toBe(2);
  });

  it("a drag shorter than the minimum duration counts as a click", () => {
    const state = after(draw(0, 600, 610));

    expect(state.meetings[0]).toMatchObject({
      startMinute: 600,
      endMinute: 650,
    });
  });

  it("snaps the fractional minutes the grid measures", () => {
    const state = after(draw(0, 601.4, 658.2));

    expect(state.meetings[0]).toMatchObject({
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

    expect(state.meetings).toEqual([]);
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

    expect(state.meetings).toEqual(oneMeeting.meetings);
    expect(state.interaction).toMatchObject({
      status: "moving",
      dayIndex: 2,
      startMinute: 700,
      endMinute: 750,
    });
  });

  it("release commits the draft's day and range", () => {
    const state = after([...grabbed, { type: "released" }], oneMeeting);

    expect(state.meetings).toEqual([
      { id: "local-1", dayIndex: 2, startMinute: 700, endMinute: 750 },
    ]);
    expect(state.interaction).toEqual({ status: "idle" });
  });

  it("cancel reverts to where the meeting was", () => {
    const state = after([...grabbed, { type: "cancelled" }], oneMeeting);

    expect(state.meetings).toEqual(oneMeeting.meetings);
    expect(state.interaction).toEqual({ status: "idle" });
  });

  it("keeps the whole meeting inside the day's hours", () => {
    const state = after(
      [
        { type: "pressedMeeting", meetingId: "local-1", minute: 550 },
        { type: "pointerMoved", dayIndex: 0, minute: 1075 },
        { type: "released" },
      ],
      oneMeeting,
    );

    expect(state.meetings[0]).toMatchObject({
      startMinute: 1030,
      endMinute: 1080,
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

    expect(state.meetings).toEqual([
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

    expect(state.meetings).toEqual(oneMeeting.meetings);
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

    expect(state.meetings[0]).toMatchObject({
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

    expect(state.meetings[0]).toMatchObject({
      startMinute: 480,
      endMinute: 530,
    });
  });
});
