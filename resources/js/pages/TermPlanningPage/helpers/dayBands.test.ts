import { describe, expect, it } from "vitest";
import { bandsForDay, busiestBand } from "./dayBands";
import { plannedSection } from "./plannedSection.fixture";
import type { Meeting, PlannedSection } from "../types";

const sectionsById: Record<string, PlannedSection> = {
  late: plannedSection(1, [], { catalogNumber: "3001" }),
  earlyB: plannedSection(2, [], { catalogNumber: "1002" }),
  earlyA: plannedSection(3, [], { catalogNumber: "1001" }),
  otherDay: plannedSection(4, [], { catalogNumber: "4004" }),
};

const sectionOf = (meetingId: string) => sectionsById[meetingId];

const meeting = (
  id: string,
  dayIndex: number,
  startMinute: number,
): Meeting => ({
  id,
  dayIndex,
  startMinute,
  endMinute: startMinute + 50,
  sectionId: sectionsById[id]?.id ?? null,
});

describe("bandsForDay", () => {
  const meetings = [
    meeting("late", 0, 660),
    meeting("earlyB", 0, 540),
    meeting("earlyA", 0, 540),
    meeting("otherDay", 1, 540),
  ];

  it("groups a day's meetings by the moment they start, in clock order", () => {
    const bands = bandsForDay(meetings, sectionOf, 0);

    expect(bands.map((band) => band.startMinute)).toEqual([540, 660]);
    expect(bands[0].label).toBe("9:00 AM");
  });

  it("leaves other days out", () => {
    const bands = bandsForDay(meetings, sectionOf, 0);

    expect(
      bands.flatMap((band) => band.items.map(({ meetingId }) => meetingId)),
    ).not.toContain("otherDay");
  });

  it("reads the courses within a band in order", () => {
    const [firstBand] = bandsForDay(meetings, sectionOf, 0);

    expect(firstBand.items.map(({ meetingId }) => meetingId)).toEqual([
      "earlyA",
      "earlyB",
    ]);
  });

  it("skips a meeting with no section, which has nothing to list", () => {
    const drawn = [meeting("local-1", 0, 540)];

    expect(bandsForDay(drawn, sectionOf, 0)).toEqual([]);
  });
});

describe("busiestBand", () => {
  it("finds the moment the most classes begin at once", () => {
    const bands = bandsForDay(
      [
        meeting("late", 0, 660),
        meeting("earlyB", 0, 540),
        meeting("earlyA", 0, 540),
      ],
      sectionOf,
      0,
    );

    expect(busiestBand(bands)?.startMinute).toBe(540);
  });

  it("has nothing to report on an empty day", () => {
    expect(busiestBand([])).toBeNull();
  });
});
