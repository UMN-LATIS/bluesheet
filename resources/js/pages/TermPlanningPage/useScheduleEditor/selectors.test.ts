import { describe, expect, it } from "vitest";
import { selectWeekView } from "./selectors";
import { NEW_SECTION_ID } from "./types";
import { selectLocalSection } from "./selectors";
import { plannedSection } from "../helpers/plannedSection.fixture";
import { initialState } from "./update";
import type { EditorState, ScheduleContext } from "./types";

/**
 * Two sections overlapping on Monday and one on Tuesday. Blocks are derived
 * from these rather than written by hand, so their ids are the ones the grid
 * uses; see `meetingIdOf`.
 */
const context: ScheduleContext = {
  sections: [
    plannedSection(1, [
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
    ]),
    plannedSection(2, [
      { days: ["mon"], startTime: "09:30", endTime: "10:20" },
    ]),
    plannedSection(3, [
      { days: ["tue"], startTime: "09:00", endTime: "09:50" },
    ]),
  ],
  isReadOnly: false,
};

const MON_9 = "s1:mon:0900";
const TUE_9 = "s3:tue:0900";

const atRest: EditorState = initialState();

describe("selectWeekView while a meeting is carried", () => {
  const carrying: EditorState = {
    ...atRest,
    interaction: {
      status: "moving",
      meetingId: MON_9,
      grabbedAfterStart: 10,
      dayIndex: 1,
      startMinute: 700,
      endMinute: 750,
    },
  };

  it("every lane stays exactly as it was at rest", () => {
    const layouts = (state: EditorState) =>
      selectWeekView(context, state, 5).map(({ layout }) => layout);

    expect(layouts(carrying)).toEqual(layouts(atRest));
  });

  it("the origin block ghosts and the overlay draws in the target day", () => {
    const [monday, tuesday] = selectWeekView(context, carrying, 5);

    expect(monday.ghostMeetingId).toBe(MON_9);
    expect(monday.overlay).toBeNull();
    // The overlay names its meeting so the block can be labeled like the
    // one the pointer picked up.
    expect(tuesday.overlay).toEqual({
      startMinute: 700,
      endMinute: 750,
      meetingId: MON_9,
      sectionId: 1,
    });
  });
});

describe("selectWeekView while a meeting is pressed", () => {
  it("draws no overlay and no ghost, since nothing is carried yet", () => {
    const pressed: EditorState = {
      ...atRest,
      interaction: {
        status: "pressed",
        meetingId: MON_9,
        grabbedAfterStart: 10,
        dayIndex: 0,
        minute: 550,
      },
    };

    const [monday] = selectWeekView(context, pressed, 5);

    expect(monday.overlay).toBeNull();
    expect(monday.ghostMeetingId).toBeNull();
  });
});

describe("selectWeekView while a meeting is drawn out", () => {
  it("the overlay names no meeting, since none exists yet", () => {
    const [monday] = selectWeekView(
      context,
      {
        ...atRest,
        interaction: {
          status: "drawing",
          dayIndex: 0,
          anchorMinute: 700,
          startMinute: 700,
          endMinute: 750,
        },
      },
      5,
    );

    expect(monday.overlay).toEqual({
      startMinute: 700,
      endMinute: 750,
      meetingId: null,
      sectionId: null,
    });
  });
});

describe("selectWeekView while a meeting is resized", () => {
  it("the block draws at its live range in its at-rest lane", () => {
    const [monday] = selectWeekView(
      context,
      {
        ...atRest,
        interaction: {
          status: "resizing",
          meetingId: MON_9,
          edge: "end",
          dayIndex: 0,
          startMinute: 540,
          endMinute: 650,
        },
      },
      5,
    );

    const resized = monday.layout.placed.find(
      ({ meeting }) => meeting.id === MON_9,
    );
    const atRestPlacement = selectWeekView(
      context,
      atRest,
      5,
    )[0].layout.placed.find(({ meeting }) => meeting.id === MON_9);

    expect(resized?.meeting.endMinute).toBe(650);
    expect(resized?.lane).toBe(atRestPlacement?.lane);
    expect(monday.activeMeetingId).toBe(MON_9);
    expect(monday.overlay).toBeNull();
  });
});

describe("selectLocalSection", () => {
  const section = plannedSection(7, [
    { days: ["mon"], startTime: "09:00", endTime: "09:50" },
  ]);

  it("shows the SIS section when nothing has been edited", () => {
    expect(selectLocalSection(section, atRest)).toEqual(section);
  });

  it("lays an edit over it, field by field", () => {
    const edited: EditorState = {
      ...atRest,
      sectionEdits: { 7: { enrollmentCap: 12, notes: "Reserved for majors" } },
    };

    expect(selectLocalSection(section, edited)).toEqual({
      ...section,
      enrollmentCap: 12,
      notes: "Reserved for majors",
    });
  });

  it("gives the plan's own fields a value the SIS never sends", () => {
    const bare = { ...section } as Partial<typeof section>;
    delete bare.delivery;
    delete bare.notes;
    delete bare.isCancelled;

    expect(selectLocalSection(bare as typeof section, atRest)).toMatchObject({
      delivery: "onCampus",
      notes: "",
      isCancelled: false,
    });
  });
});

describe("selectWeekView over local edits", () => {
  it("the section being created packs alongside the placed sections", () => {
    const drawn: EditorState = {
      ...atRest,
      drafts: {
        [NEW_SECTION_ID]: {
          meetings: [{ days: ["tue"], startTime: "09:20", endTime: "10:10" }],
        },
      },
    };

    const tuesday = selectWeekView(context, drawn, 5)[1];

    expect(tuesday.layout.placed.map(({ meeting }) => meeting.id)).toEqual([
      TUE_9,
      "s-1:tue:0920",
    ]);
  });
});

describe("selectWeekView with a meeting selected", () => {
  it("names the selected meeting only in the day that holds it", () => {
    const selected: EditorState = {
      ...atRest,
      selection: { kind: "meeting", meetingId: TUE_9 },
    };

    const [monday, tuesday] = selectWeekView(context, selected, 5);

    expect(monday.selectedMeetingId).toBeNull();
    expect(tuesday.selectedMeetingId).toBe(TUE_9);
  });
});
