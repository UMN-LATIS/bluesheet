import { describe, expect, it } from "vitest";
import { emptyFilters, initialState, update } from "./update";
import { placeSections } from "../helpers/sectionPlacement";
import { plannedSection } from "../helpers/plannedSection.fixture";
import type {
  EditorDeps,
  EditorEvent,
  EditorState,
  ScheduleContext,
  SectionEdit,
} from "./types";

const emptyContext: ScheduleContext = {
  meetings: [],
  sections: [],
  isReadOnly: false,
};

/** Built through `placeSections`, so block ids match the grid's. */
const contextOf = (
  ...sections: ReturnType<typeof plannedSection>[]
): ScheduleContext => ({
  meetings: placeSections(sections).meetings,
  sections,
  isReadOnly: false,
});

const countingUuids = (): EditorDeps => {
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
      { type: "canceled" },
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
    const state = after([...grabbed, { type: "canceled" }], oneMeeting);

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
        { type: "canceled" },
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

  it("a canceled gesture places nothing", () => {
    const state = after([
      { type: "pressedEmptySpace", dayIndex: 0, minute: 600 },
      { type: "pointerMoved", dayIndex: 0, minute: 700 },
      { type: "canceled" },
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

  it("canceled at rest clears the selection", () => {
    const selected = after(click(), initialState(), base);
    const state = after([{ type: "canceled" }], selected, base);

    expect(state.selection).toBeNull();
  });

  it("canceled mid-drag keeps the selection and discards the drag", () => {
    const selected = after(click(), initialState(), base);
    const state = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "pointerMoved", dayIndex: 2, minute: 710 },
        { type: "canceled" },
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
      component: ["LEC"],
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

  it("the page opens on lectures alone", () => {
    expect(initialState().filters.component).toEqual(["LEC"]);
  });

  it("clearing empties every facet, the opening lectures included", () => {
    const state = after([
      twoCourses,
      { type: "filterValuesAdded", facet: "person", values: ["tba"] },
      { type: "filtersCleared" },
    ]);

    expect(state.filters).toEqual(emptyFilters());
  });

  it("a URL sets the facets it names and defaults the ones it does not", () => {
    const state = after([
      twoCourses,
      { type: "urlChanged", query: { course: "ANTH-1001", section: "4821" } },
    ]);

    expect(state.filters).toEqual({
      course: ["ANTH-1001"],
      person: [],
      section: ["4821"],
      component: ["LEC"],
    });
  });

  it("a URL naming an empty component asks for every type", () => {
    const state = after([
      twoCourses,
      { type: "urlChanged", query: { component: "" } },
    ]);

    expect(state.filters.component).toEqual([]);
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
});

describe("the URL", () => {
  const step = (
    event: EditorEvent,
    state: EditorState = initialState(),
    context: ScheduleContext = emptyContext,
  ) => update(state, event, context, countingUuids());

  const checkTwoCourses: EditorEvent = {
    type: "filterValuesAdded",
    facet: "course",
    values: ["ANTH-1001", "HIST-1082"],
  };

  it("a change the user makes is written back in one piece", () => {
    expect(step(checkTwoCourses).effects).toEqual([
      {
        type: "replaceUrlQuery",
        query: {
          course: "ANTH-1001,HIST-1082",
          component: "LEC",
          view: "week",
        },
      },
    ]);
  });

  it("a change that came from the URL is not echoed back", () => {
    expect(
      step({ type: "urlChanged", query: { course: "ANTH-1001" } }).effects,
    ).toEqual([]);
  });

  it("a gesture that changes nothing a link names writes nothing", () => {
    expect(
      step({ type: "pressedEmptySpace", dayIndex: 0, minute: 600 }).effects,
    ).toEqual([]);
  });

  it("the day is named only while the day list is the view", () => {
    const onWednesday = after([
      { type: "viewSelected", view: "day" },
      { type: "daySelected", dayIndex: 2 },
    ]);

    expect(
      step({ type: "viewSelected", view: "day" }, onWednesday).effects,
    ).toEqual([]);
    expect(
      step({ type: "viewSelected", view: "heatmap" }, onWednesday).effects,
    ).toEqual([
      {
        type: "replaceUrlQuery",
        query: { component: "LEC", view: "heatmap" },
      },
    ]);
  });

  it("the Async cell moves the view and the day together", () => {
    const next = step({ type: "asyncDayShown" });

    expect(next.state.view).toBe("day");
    expect(next.effects).toEqual([
      {
        type: "replaceUrlQuery",
        query: { component: "LEC", view: "day", day: "async" },
      },
    ]);
  });

  it("a URL naming no day leaves the tab already open alone", () => {
    const onThursday = after([{ type: "daySelected", dayIndex: 3 }]);
    const state = step(
      { type: "urlChanged", query: { view: "week" } },
      onThursday,
    ).state;

    expect(state.dayIndex).toBe(3);
  });

  it("a selected block survives the query it wrote coming back", () => {
    const context = contextOf(
      plannedSection(1, [
        { days: ["mon"], startTime: "09:00", endTime: "09:50" },
      ]),
    );
    const selected = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "released" },
      ],
      initialState(),
      context,
    );

    const returned = step(
      { type: "urlChanged", query: { sectionId: "1", view: "week" } },
      selected,
      context,
    );

    expect(returned.state.selection).toEqual({
      kind: "meeting",
      meetingId: "s1:mon:0900",
    });
  });

  it("a link naming another section opens that one instead", () => {
    const context = contextOf(
      plannedSection(1, [
        { days: ["mon"], startTime: "09:00", endTime: "09:50" },
      ]),
    );
    const selected = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "released" },
      ],
      initialState(),
      context,
    );

    const returned = step(
      { type: "urlChanged", query: { sectionId: "7" } },
      selected,
      context,
    );

    expect(returned.state.selection).toEqual({ kind: "section", sectionId: 7 });
  });
});

describe("the sheet's draft", () => {
  const section = plannedSection(1, [
    { days: ["mon"], startTime: "09:00", endTime: "09:50" },
  ]);
  const context = contextOf(section);

  const edit = (change: SectionEdit): EditorEvent => ({
    type: "sectionFieldEdited",
    sectionId: 1,
    change,
  });

  it("a keystroke reaches the draft and nothing else", () => {
    const state = after([edit({ enrollmentCap: 12 })], initialState(), context);

    expect(state.drafts).toEqual({ 1: { enrollmentCap: 12 } });
    expect(state.sectionEdits).toEqual({});
  });

  it("later keystrokes add to the same draft", () => {
    const state = after(
      [edit({ enrollmentCap: 12 }), edit({ notes: "Majors only" })],
      initialState(),
      context,
    );

    expect(state.drafts[1]).toEqual({
      enrollmentCap: 12,
      notes: "Majors only",
    });
  });

  it("saving moves the draft into the section's edits", () => {
    const state = after(
      [edit({ enrollmentCap: 12 }), { type: "draftSaved", sectionId: 1 }],
      initialState(),
      context,
    );

    expect(state.sectionEdits).toEqual({ 1: { enrollmentCap: 12 } });
    expect(state.drafts).toEqual({});
  });

  it("saving keeps edits the form never touched", () => {
    const saved = after(
      [edit({ enrollmentCap: 12 }), { type: "draftSaved", sectionId: 1 }],
      initialState(),
      context,
    );
    const state = after(
      [edit({ notes: "Majors only" }), { type: "draftSaved", sectionId: 1 }],
      saved,
      context,
    );

    expect(state.sectionEdits[1]).toEqual({
      enrollmentCap: 12,
      notes: "Majors only",
    });
  });

  it("cancelling drops the form and leaves the schedule as it was", () => {
    const state = after(
      [edit({ enrollmentCap: 12 }), { type: "draftCancelled", sectionId: 1 }],
      initialState(),
      context,
    );

    expect(state.drafts).toEqual({});
    expect(state.sectionEdits).toEqual({});
  });

  it("a draft for one section survives editing another", () => {
    const state = after(
      [
        edit({ enrollmentCap: 12 }),
        { type: "sectionFieldEdited", sectionId: 2, change: { notes: "x" } },
      ],
      initialState(),
      context,
    );

    expect(state.drafts[1]).toEqual({ enrollmentCap: 12 });
    expect(state.drafts[2]).toEqual({ notes: "x" });
  });

  it("reverting drops both the saved edits and any form still open over them", () => {
    const edited = after(
      [
        edit({ enrollmentCap: 12 }),
        { type: "draftSaved", sectionId: 1 },
        edit({ notes: "Majors only" }),
      ],
      initialState(),
      context,
    );
    const state = after(
      [{ type: "sectionEditsReverted", sectionId: 1 }],
      edited,
      context,
    );

    expect(state.sectionEdits).toEqual({});
    expect(state.drafts).toEqual({});
  });
});

describe("days and times in the sheet", () => {
  const section = plannedSection(1, [
    { days: ["mon", "wed"], startTime: "09:00", endTime: "09:50" },
  ]);
  const context = contextOf(section);

  const draftPatterns = (state: EditorState) => state.drafts[1]?.meetings;

  it("a day pressed for the first time starts from the section's own pattern", () => {
    const state = after(
      [
        {
          type: "meetingDayToggled",
          sectionId: 1,
          patternIndex: 0,
          day: "fri",
        },
      ],
      initialState(),
      context,
    );

    expect(draftPatterns(state)).toEqual([
      { days: ["mon", "wed", "fri"], startTime: "09:00", endTime: "09:50" },
    ]);
  });

  it("unchecking the last day drops the pattern, which is what Async means", () => {
    const state = after(
      [
        {
          type: "meetingDayToggled",
          sectionId: 1,
          patternIndex: 0,
          day: "mon",
        },
        {
          type: "meetingDayToggled",
          sectionId: 1,
          patternIndex: 0,
          day: "wed",
        },
      ],
      initialState(),
      context,
    );

    expect(draftPatterns(state)).toEqual([]);
  });

  it("a day pressed with no pattern left starts one at the default time", () => {
    const async = after(
      [{ type: "madeAsynchronous", sectionId: 1 }],
      initialState(),
      context,
    );
    const state = after(
      [
        {
          type: "meetingDayToggled",
          sectionId: 1,
          patternIndex: 0,
          day: "tue",
        },
      ],
      async,
      context,
    );

    expect(draftPatterns(state)).toEqual([
      { days: ["tue"], startTime: "09:45", endTime: "11:00" },
    ]);
  });

  it("a time change touches only the pattern it names", () => {
    const twoPatterns = contextOf(
      plannedSection(1, [
        { days: ["mon"], startTime: "09:00", endTime: "09:50" },
        { days: ["wed"], startTime: "13:00", endTime: "13:50" },
      ]),
    );

    const state = after(
      [
        {
          type: "meetingTimeEdited",
          sectionId: 1,
          patternIndex: 1,
          endTime: "14:45",
        },
      ],
      initialState(),
      twoPatterns,
    );

    expect(draftPatterns(state)).toEqual([
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
      { days: ["wed"], startTime: "13:00", endTime: "14:45" },
    ]);
  });

  it("saving collapses a day that ended up meeting twice at once", () => {
    const state = after(
      [
        // "Add meeting time" lands on Monday, which the section already has.
        { type: "meetingPatternAdded", sectionId: 1 },
        { type: "draftSaved", sectionId: 1 },
      ],
      initialState(),
      contextOf(
        plannedSection(1, [
          { days: ["mon", "wed"], startTime: "09:45", endTime: "11:00" },
        ]),
      ),
    );

    expect(state.sectionEdits[1].meetings).toEqual([
      { days: ["mon", "wed"], startTime: "09:45", endTime: "11:00" },
    ]);
  });

  it("saving a move keeps the sheet on the section, at its new block", () => {
    const selected = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "released" },
      ],
      initialState(),
      context,
    );

    const state = after(
      [
        { type: "madeAsynchronous", sectionId: 1 },
        {
          type: "meetingDayToggled",
          sectionId: 1,
          patternIndex: 0,
          day: "thu",
        },
        { type: "draftSaved", sectionId: 1 },
      ],
      selected,
      context,
    );

    expect(state.selection).toEqual({
      kind: "meeting",
      meetingId: "s1:thu:0945",
    });
  });

  it("saving a section into the tray leaves the sheet open on the section", () => {
    const selected = after(
      [
        { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
        { type: "released" },
      ],
      initialState(),
      context,
    );

    const state = after(
      [
        { type: "madeAsynchronous", sectionId: 1 },
        { type: "draftSaved", sectionId: 1 },
      ],
      selected,
      context,
    );

    expect(state.selection).toEqual({ kind: "section", sectionId: 1 });
  });
});

describe("a read-only term", () => {
  const section = plannedSection(1, [
    { days: ["mon"], startTime: "09:00", endTime: "09:50" },
  ]);

  const lockedContext: ScheduleContext = {
    ...contextOf(section),
    isReadOnly: true,
  };

  const locked = (events: EditorEvent[]) =>
    after(events, initialState(), lockedContext);

  it("refuses an edit to a section", () => {
    const state = locked([
      { type: "sectionFieldEdited", sectionId: 1, change: { notes: "hi" } },
    ]);

    expect(state.drafts).toEqual({});
  });

  it("refuses a meeting drawn on empty space", () => {
    expect(locked(draw(0, 600, 700)).placeholderMeetings).toEqual([]);
  });

  it("refuses to move a block, so pressing one only selects it", () => {
    const state = locked([
      { type: "pressedMeeting", meetingId: "s1:mon:0900", minute: 550 },
      { type: "pointerMoved", dayIndex: 3, minute: 710 },
      { type: "released" },
    ]);

    expect(state.sectionEdits).toEqual({});
    expect(state.selection).toEqual({
      kind: "meeting",
      meetingId: "s1:mon:0900",
    });
  });

  it("still selects, deselects, and filters", () => {
    const state = locked([
      { type: "selectedSection", sectionId: 1 },
      { type: "filterValuesAdded", facet: "component", values: ["LEC"] },
    ]);

    expect(state.selection).toEqual({ kind: "section", sectionId: 1 });
    expect(state.filters.component).toEqual(["LEC"]);
  });
});

describe("sectionEditsPersisted", () => {
  const section = plannedSection(1, []);
  const context = contextOf(section);

  /** A sheet edit, saved, which is how an edit reaches the overlay. */
  const editAndSave = (notes: string): EditorEvent[] => [
    { type: "sectionFieldEdited", sectionId: 1, change: { notes } },
    { type: "draftSaved", sectionId: 1 },
  ];

  it("drops the overlay once the server holds it", () => {
    const edited = after(editAndSave("saved"), initialState(), context);
    expect(edited.sectionEdits[1]).toEqual({ notes: "saved" });

    const state = after(
      [
        {
          type: "sectionEditsPersisted",
          sectionId: 1,
          saved: { notes: "saved" },
        },
      ],
      edited,
      context,
    );

    expect(state.sectionEdits[1]).toBeUndefined();
  });

  it("keeps an edit made while the save was in flight", () => {
    // "one" was the version sent; "two" was saved before the reply came back
    const edited = after(
      [...editAndSave("one"), ...editAndSave("two")],
      initialState(),
      context,
    );

    const state = after(
      [
        {
          type: "sectionEditsPersisted",
          sectionId: 1,
          saved: { notes: "one" },
        },
      ],
      edited,
      context,
    );

    expect(state.sectionEdits[1]).toEqual({ notes: "two" });
  });

  it("still lets go once the term has locked", () => {
    const edited = after(editAndSave("saved"), initialState(), context);

    const state = after(
      [
        {
          type: "sectionEditsPersisted",
          sectionId: 1,
          saved: { notes: "saved" },
        },
      ],
      edited,
      { ...context, isReadOnly: true },
    );

    expect(state.sectionEdits[1]).toBeUndefined();
  });
});
