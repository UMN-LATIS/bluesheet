import { describe, expect, it } from "vitest";
import { selectWeekView } from "./selectors";
import type { Meeting } from "../types";
import { selectLocalSection } from "./selectors";
import { plannedSection } from "../helpers/plannedSection.fixture";
import type { EditorState, ScheduleContext } from "./types";

const meetings: Meeting[] = [
  {
    id: "mon-9",
    dayIndex: 0,
    sectionId: null,
    startMinute: 540,
    endMinute: 590,
  },
  {
    id: "mon-9b",
    dayIndex: 0,
    sectionId: null,
    startMinute: 570,
    endMinute: 620,
  },
  {
    id: "tue-9",
    dayIndex: 1,
    sectionId: null,
    startMinute: 540,
    endMinute: 590,
  },
];

/** No sections: every test here is about blocks, not about what is in them. */
const context: ScheduleContext = { meetings, sections: [], isReadOnly: false };

const atRest: EditorState = {
  placeholderMeetings: [],
  sectionEdits: {},
  drafts: {},
  interaction: { status: "idle" },
  lastPlacedId: null,
  selection: null,
  filters: { course: [], person: [], section: [], component: [] },
};

describe("selectWeekView while a meeting is carried", () => {
  const carrying: EditorState = {
    ...atRest,
    interaction: {
      status: "moving",
      meetingId: "mon-9",
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

    expect(monday.ghostMeetingId).toBe("mon-9");
    expect(monday.overlay).toBeNull();
    // The overlay names its meeting so the block can be labeled like the
    // one the pointer picked up.
    expect(tuesday.overlay).toEqual({
      startMinute: 700,
      endMinute: 750,
      meetingId: "mon-9",
      sectionId: null,
    });
  });
});

describe("selectWeekView while a meeting is pressed", () => {
  it("draws no overlay and no ghost, since nothing is carried yet", () => {
    const pressed: EditorState = {
      ...atRest,
      interaction: {
        status: "pressed",
        meetingId: "mon-9",
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
          meetingId: "mon-9",
          edge: "end",
          dayIndex: 0,
          startMinute: 540,
          endMinute: 650,
        },
      },
      5,
    );

    const resized = monday.layout.placed.find(
      ({ meeting }) => meeting.id === "mon-9",
    );
    const atRestPlacement = selectWeekView(
      context,
      atRest,
      5,
    )[0].layout.placed.find(({ meeting }) => meeting.id === "mon-9");

    expect(resized?.meeting.endMinute).toBe(650);
    expect(resized?.lane).toBe(atRestPlacement?.lane);
    expect(monday.activeMeetingId).toBe("mon-9");
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
  it("placeholder times pack alongside the placed sections", () => {
    const drawn: EditorState = {
      ...atRest,
      placeholderMeetings: [
        {
          id: "local-1",
          dayIndex: 1,
          sectionId: null,
          startMinute: 560,
          endMinute: 610,
        },
      ],
    };

    const tuesday = selectWeekView(context, drawn, 5)[1];

    expect(tuesday.layout.placed.map(({ meeting }) => meeting.id)).toEqual([
      "tue-9",
      "local-1",
    ]);
  });
});

describe("selectWeekView with a meeting selected", () => {
  it("names the selected meeting only in the day that holds it", () => {
    const selected: EditorState = {
      ...atRest,
      selection: { kind: "meeting", meetingId: "tue-9" },
    };

    const [monday, tuesday] = selectWeekView(context, selected, 5);

    expect(monday.selectedMeetingId).toBeNull();
    expect(tuesday.selectedMeetingId).toBe("tue-9");
  });
});
