import { describe, expect, it } from "vitest";
import { selectWeekView } from "./selectors";
import type { Meeting } from "../types";
import type { EditorState } from "./types";

const base: Meeting[] = [
  { id: "mon-9", dayIndex: 0, startMinute: 540, endMinute: 590 },
  { id: "mon-9b", dayIndex: 0, startMinute: 570, endMinute: 620 },
  { id: "tue-9", dayIndex: 1, startMinute: 540, endMinute: 590 },
];

const atRest: EditorState = {
  drawn: [],
  overrides: {},
  interaction: { status: "idle" },
  nextLocalId: 1,
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
      selectWeekView(base, state, 5).map(({ layout }) => layout);

    expect(layouts(carrying)).toEqual(layouts(atRest));
  });

  it("the origin block ghosts and the overlay draws in the target day", () => {
    const [monday, tuesday] = selectWeekView(base, carrying, 5);

    expect(monday.ghostMeetingId).toBe("mon-9");
    expect(monday.overlay).toBeNull();
    expect(tuesday.overlay).toEqual({ startMinute: 700, endMinute: 750 });
  });
});

describe("selectWeekView while a meeting is resized", () => {
  it("the block draws at its live range in its at-rest lane", () => {
    const [monday] = selectWeekView(
      base,
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
      base,
      atRest,
      5,
    )[0].layout.placed.find(({ meeting }) => meeting.id === "mon-9");

    expect(resized?.meeting.endMinute).toBe(650);
    expect(resized?.lane).toBe(atRestPlacement?.lane);
    expect(monday.activeMeetingId).toBe("mon-9");
    expect(monday.overlay).toBeNull();
  });
});

describe("selectWeekView over local edits", () => {
  it("draws a base meeting where its override put it", () => {
    const moved: EditorState = {
      ...atRest,
      overrides: {
        "tue-9": { dayIndex: 3, startMinute: 700, endMinute: 750 },
      },
    };

    const week = selectWeekView(base, moved, 5);
    const ids = (dayIndex: number) =>
      week[dayIndex].layout.placed.map(({ meeting }) => meeting.id);

    expect(ids(1)).toEqual([]);
    expect(ids(3)).toEqual(["tue-9"]);
  });

  it("an override outliving its meeting draws nothing", () => {
    const orphaned: EditorState = {
      ...atRest,
      overrides: {
        gone: { dayIndex: 2, startMinute: 700, endMinute: 750 },
      },
    };

    const wednesday = selectWeekView(base, orphaned, 5)[2];

    expect(wednesday.layout.placed).toEqual([]);
  });

  it("drawn meetings pack alongside the base's", () => {
    const drawn: EditorState = {
      ...atRest,
      drawn: [{ id: "local-1", dayIndex: 1, startMinute: 560, endMinute: 610 }],
    };

    const tuesday = selectWeekView(base, drawn, 5)[1];

    expect(tuesday.layout.placed.map(({ meeting }) => meeting.id)).toEqual([
      "tue-9",
      "local-1",
    ]);
  });
});
