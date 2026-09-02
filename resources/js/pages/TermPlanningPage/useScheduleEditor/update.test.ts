import { describe, expect, it } from "vitest";
import { initialState, update } from "./update";
import { placeSections } from "../helpers/sectionPlacement";
import { plannedSection } from "../helpers/plannedSection.fixture";
import type { EditorEvent, EditorState, ScheduleContext } from "./types";

/** Nothing on the grid, for the tests that draw their own blocks. */
const emptyContext: ScheduleContext = { meetings: [], sections: [] };

/**
 * The context the page hands in: sections with this browser's edits already
 * in them, placed. Built through `placeSections` so the block ids under test
 * are the ones the grid really uses.
 */
const contextOf = (...sections: ReturnType<typeof plannedSection>[]) => ({
  meetings: placeSections(sections).meetings,
  sections,
});

/**
 * A stand-in for `crypto.randomUUID` that counts, so a placeholder meeting
 * has a name worth asserting on. One counter per run of events.
 */
const countingUuids = () => {
  let count = 0;
  return { createUuid: () => `local-${++count}` };
};

const after = (
  events: EditorEvent[],
  state: EditorState = initialState(),
  context: ScheduleContext = emptyContext,
) => {
  const deps = countingUuids();
  return events.reduce(
    (current, event) => update(current, event, context, deps).state,
    state,
  );
};

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

    expect(state.placeholderMeetings).toEqual([
      {
        id: "local-1",
        dayIndex: 0,
        sectionId: null,
        startMinute: 600,
        endMinute: 650,
      },
    ]);
  });

  it("a drag creates the dragged range", () => {
    const state = after(draw(2, 600, 675));

    expect(state.placeholderMeetings).toEqual([
      {
        id: "local-1",
        dayIndex: 2,
        sectionId: null,
        startMinute: 600,
        endMinute: 675,
      },
    ]);
  });

  it("a drag shorter than the minimum duration counts as a click", () => {
    const state = after(draw(0, 600, 610));

    expect(state.placeholderMeetings[0]).toMatchObject({
      startMinute: 600,
      endMinute: 650,
    });
  });

  it("snaps the fractional minutes the grid measures", () => {
    const state = after(draw(0, 601.4, 658.2));

    expect(state.placeholderMeetings[0]).toMatchObject({
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

    expect(state.placeholderMeetings).toEqual([]);
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

    expect(state.placeholderMeetings).toEqual(oneMeeting.placeholderMeetings);
    expect(state.interaction).toMatchObject({
      status: "moving",
      dayIndex: 2,
      startMinute: 700,
      endMinute: 750,
    });
  });

  it("release commits the draft's day and range", () => {
    const state = after([...grabbed, { type: "released" }], oneMeeting);

    expect(state.placeholderMeetings).toEqual([
      {
        id: "local-1",
        dayIndex: 2,
        sectionId: null,
        startMinute: 700,
        endMinute: 750,
      },
    ]);
    expect(state.interaction).toEqual({ status: "idle" });
  });

  it("cancel reverts to where the meeting was", () => {
    const state = after([...grabbed, { type: "cancelled" }], oneMeeting);

    expect(state.placeholderMeetings).toEqual(oneMeeting.placeholderMeetings);
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

    expect(state.placeholderMeetings[0]).toMatchObject({
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

    expect(state.placeholderMeetings).toEqual([
      {
        id: "local-1",
        dayIndex: 1,
        sectionId: null,
        startMinute: 540,
        endMinute: 645,
      },
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

    expect(state.placeholderMeetings).toEqual(oneMeeting.placeholderMeetings);
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

    expect(state.placeholderMeetings[0]).toMatchObject({
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

    expect(state.placeholderMeetings[0]).toMatchObject({
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
      [
        { type: "pressedMeeting", meetingId: "local-1", minute: 610 },
        { type: "pointerMoved", dayIndex: 0, minute: 700 },
      ],
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

describe("dragging a section's block", () => {
  /** One section, Mon and Wed at 9, so a drag has a pattern to break up. */
  const monAndWed = () =>
    plannedSection(1, [
      { days: ["mon", "wed"], startTime: "09:00", endTime: "09:50" },
    ]);

  const context = () => contextOf(monAndWed());

  const move = (
    meetingId: string,
    toDay: number,
    toMinute: number,
  ): EditorEvent[] => [
    { type: "pressedMeeting", meetingId, minute: 550 },
    { type: "pointerMoved", dayIndex: toDay, minute: toMinute },
    { type: "released" },
  ];

  it("writes the section's patterns, not a placement of its own", () => {
    const state = after(move("s1:mon:0900", 3, 710), initialState(), context());

    expect(state.placeholderMeetings).toEqual([]);
    expect(state.sectionEdits).toEqual({
      1: {
        meetings: [
          { days: ["wed"], startTime: "09:00", endTime: "09:50" },
          { days: ["thu"], startTime: "11:40", endTime: "12:30" },
        ],
      },
    });
  });

  it("a second grab picks the block up where the user last put it", () => {
    const moved = after(move("s1:mon:0900", 3, 710), initialState(), context());
    const afterMove = contextOf(
      plannedSection(1, moved.sectionEdits[1].meetings!),
    );

    const state = after(
      [
        // A press with no drag: the commit re-states the current placement.
        { type: "pressedMeeting", meetingId: "s1:thu:1140", minute: 1180 },
        { type: "released" },
      ],
      moved,
      afterMove,
    );

    expect(state.selection).toEqual({
      kind: "meeting",
      meetingId: "s1:thu:1140",
    });
  });

  it("resizing states that day separately at its new length", () => {
    const state = after(
      [
        {
          type: "pressedMeetingEdge",
          meetingId: "s1:wed:0900",
          edge: "end",
          minute: 590,
        },
        { type: "pointerMoved", dayIndex: 2, minute: 645 },
        { type: "released" },
      ],
      initialState(),
      context(),
    );

    expect(state.sectionEdits[1].meetings).toEqual([
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
      { days: ["wed"], startTime: "09:00", endTime: "10:45" },
    ]);
  });

  it("the drop flash and the selection follow the block to its new name", () => {
    const selected = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "released" },
      ],
      initialState(),
      context(),
    );

    const state = after(move("s1:mon:0900", 3, 710), selected, context());

    expect(state.lastPlacedId).toBe("s1:thu:1140");
    expect(state.selection).toEqual({
      kind: "meeting",
      meetingId: "s1:thu:1140",
    });
  });
});

describe("selecting", () => {
  const base = contextOf(
    plannedSection(1, [
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
    ]),
  );

  const click = (): EditorEvent[] => [
    { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
    { type: "released" },
  ];

  it("a press and release with no move selects the meeting", () => {
    const state = after(click(), initialState(), base);

    expect(state.selection).toEqual({
      kind: "meeting",
      meetingId: "s1:mon:0900",
    });
    expect(state.sectionEdits).toEqual({});
    expect(state.lastPlacedId).toBeNull();
  });

  it("a wobble under the drag threshold is still a click", () => {
    const state = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "pointerMoved", dayIndex: 0, minute: 556 },
        { type: "released" },
      ],
      initialState(),
      base,
    );

    expect(state.selection).toEqual({
      kind: "meeting",
      meetingId: "s1:mon:0900",
    });
    expect(state.sectionEdits).toEqual({});
    expect(state.interaction).toEqual({ status: "idle" });
  });

  it("moving past the threshold carries the block", () => {
    const state = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "pointerMoved", dayIndex: 0, minute: 575 },
        { type: "released" },
      ],
      initialState(),
      base,
    );

    expect(state.sectionEdits[1]).toBeDefined();
    expect(state.selection).toBeNull();
  });

  it("crossing into another day carries it however small the vertical move", () => {
    const state = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "pointerMoved", dayIndex: 1, minute: 551 },
        { type: "released" },
      ],
      initialState(),
      base,
    );

    expect(state.sectionEdits[1].meetings).toEqual([
      { days: ["tue"], startTime: "09:00", endTime: "09:50" },
    ]);
    expect(state.selection).toBeNull();
  });

  it("a press, move, and release commits the drag and leaves selection unchanged", () => {
    const state = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "pointerMoved", dayIndex: 2, minute: 710 },
        { type: "released" },
      ],
      initialState(),
      base,
    );

    expect(state.sectionEdits[1].meetings).toEqual([
      { days: ["wed"], startTime: "11:40", endTime: "12:30" },
    ]);
    expect(state.selection).toBeNull();
  });

  it("deselected clears the selection", () => {
    const selected = after(click(), initialState(), base);
    const state = after([{ type: "deselected" }], selected, base);

    expect(state.selection).toBeNull();
  });

  it("cancelled at rest clears the selection", () => {
    const selected = after(click(), initialState(), base);
    const state = after([{ type: "cancelled" }], selected, base);

    expect(state.selection).toBeNull();
  });

  it("cancelled mid-drag keeps the selection and discards the drag", () => {
    const selected = after(click(), initialState(), base);
    const state = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "pointerMoved", dayIndex: 2, minute: 710 },
        { type: "cancelled" },
      ],
      selected,
      base,
    );

    expect(state.selection).toEqual({
      kind: "meeting",
      meetingId: "s1:mon:0900",
    });
    expect(state.sectionEdits).toEqual({});
    expect(state.interaction).toEqual({ status: "idle" });
  });
});

describe("filtering", () => {
  const twoCourses: EditorEvent = {
    type: "filterValuesAdded",
    facet: "course",
    values: ["HIST-1082", "HIST-1301W"],
  };

  it("adding checks values, once each", () => {
    const state = after([
      twoCourses,
      { type: "filterValuesAdded", facet: "course", values: ["HIST-1082"] },
      { type: "filterValuesAdded", facet: "person", values: ["tba"] },
    ]);

    expect(state.filters).toEqual({
      course: ["HIST-1082", "HIST-1301W"],
      person: ["tba"],
      section: [],
      component: [],
    });
  });

  it("removing unchecks only the named values in that facet", () => {
    const state = after([
      twoCourses,
      { type: "filterValuesAdded", facet: "person", values: ["1"] },
      { type: "filterValuesRemoved", facet: "course", values: ["HIST-1082"] },
    ]);

    expect(state.filters.course).toEqual(["HIST-1301W"]);
    expect(state.filters.person).toEqual(["1"]);
  });

  it("clearing empties every facet", () => {
    const state = after([
      twoCourses,
      { type: "filterValuesAdded", facet: "component", values: ["LEC"] },
      { type: "filtersCleared" },
    ]);

    expect(state.filters).toEqual(initialState().filters);
  });

  it("replacing sets the filters exactly as given", () => {
    const filters = {
      course: ["ANTH-1001"],
      person: [],
      section: ["4821"],
      component: [],
    };
    const state = after([twoCourses, { type: "filtersReplaced", filters }]);

    expect(state.filters).toEqual(filters);
  });

  it("leaves the selection and the schedule alone", () => {
    const selected = after(
      [
        { type: "pressedMeeting", meetingId: "local-1", minute: 550 },
        { type: "released" },
      ],
      after(draw(0, 540, 590)),
    );
    const state = after([twoCourses], selected);

    expect(state.selection).toEqual({ kind: "meeting", meetingId: "local-1" });
    expect(state.placeholderMeetings).toEqual(selected.placeholderMeetings);
  });

  describe("effects", () => {
    it("a change the user makes is synced to the URL", () => {
      const step = update(
        initialState(),
        twoCourses,
        emptyContext,
        countingUuids(),
      );

      expect(step.effects).toEqual([
        { type: "syncFiltersToUrl", filters: step.state.filters },
      ]);
    });

    it("a change that came from the URL is not echoed back", () => {
      const step = update(
        initialState(),
        { type: "filtersReplaced", filters: initialState().filters },
        emptyContext,
        countingUuids(),
      );

      expect(step.effects).toEqual([]);
    });

    it("gestures have no effects", () => {
      const step = update(
        initialState(),
        { type: "pressedEmptySpace", dayIndex: 0, minute: 600 },
        emptyContext,
        countingUuids(),
      );

      expect(step.effects).toEqual([]);
    });
  });
});
