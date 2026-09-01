import { describe, expect, it } from "vitest";
import { selectWeekView } from "./selectors";
import type { EditorState } from "./types";

const atRest: EditorState = {
  meetings: [
    { id: "mon-9", dayIndex: 0, startMinute: 540, endMinute: 590 },
    { id: "mon-9b", dayIndex: 0, startMinute: 570, endMinute: 620 },
    { id: "tue-9", dayIndex: 1, startMinute: 540, endMinute: 590 },
  ],
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
      selectWeekView(state, 5).map(({ layout }) => layout);

    expect(layouts(carrying)).toEqual(layouts(atRest));
  });

  it("the origin block ghosts and the overlay draws in the target day", () => {
    const [monday, tuesday] = selectWeekView(carrying, 5);

    expect(monday.ghostMeetingId).toBe("mon-9");
    expect(monday.overlay).toBeNull();
    expect(tuesday.overlay).toEqual({ startMinute: 700, endMinute: 750 });
  });
});

describe("selectWeekView while a meeting is resized", () => {
  it("the block draws at its live range in its at-rest lane", () => {
    const [monday] = selectWeekView(
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
    const atRestPlacement = selectWeekView(atRest, 5)[0].layout.placed.find(
      ({ meeting }) => meeting.id === "mon-9",
    );

    expect(resized?.meeting.endMinute).toBe(650);
    expect(resized?.lane).toBe(atRestPlacement?.lane);
    expect(monday.activeMeetingId).toBe("mon-9");
    expect(monday.overlay).toBeNull();
  });
});
