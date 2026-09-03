import { describe, expect, it } from "vitest";
import { placeSections } from "./sectionPlacement";
import { plannedSection as section } from "./plannedSection.fixture";
import type { SisSectionMeeting } from "../types";

describe("placeSections", () => {
  it("spreads one meeting pattern over each day it meets", () => {
    const placed = placeSections([
      section(1, [
        { days: ["mon", "wed"], startTime: "10:10", endTime: "11:00" },
      ]),
    ]);

    expect(placed.meetings).toEqual([
      {
        id: "s1:mon:1010",
        dayIndex: 0,
        startMinute: 610,
        endMinute: 660,
        sectionId: 1,
      },
      {
        id: "s1:wed:1010",
        dayIndex: 2,
        startMinute: 610,
        endMinute: 660,
        sectionId: 1,
      },
    ]);
    expect(placed.sectionsByMeetingId.get("s1:mon:1010")?.id).toBe(1);
  });

  it("a crosslisted class draws once, under its primary", () => {
    const shared: SisSectionMeeting[] = [
      { days: ["tue"], startTime: "13:00", endTime: "14:15" },
    ];
    const placed = placeSections([
      section(1, shared, {
        crosslist: {
          raw: "ANTH 1001/GWSS 1001",
          partners: [],
          isPrimary: true,
        },
      }),
      section(2, shared, {
        subject: "GWSS",
        crosslist: {
          raw: "ANTH 1001/GWSS 1001",
          partners: [],
          isPrimary: false,
        },
      }),
    ]);

    expect(placed.meetings.map(({ id }) => id)).toEqual(["s1:tue:1300"]);
    expect(placed.sectionsByMeetingId.get("s1:tue:1300")?.id).toBe(1);
  });

  it("a crosslisted class still draws when its primary is another department's", () => {
    const placed = placeSections([
      section(2, [{ days: ["tue"], startTime: "13:00", endTime: "14:15" }], {
        subject: "GWSS",
        crosslist: {
          raw: "ANTH 1001/GWSS 1001",
          partners: [],
          isPrimary: false,
        },
      }),
    ]);

    expect(placed.meetings.map(({ id }) => id)).toEqual(["s2:tue:1300"]);
  });

  it("with no primary present, the lowest-numbered partner draws the block", () => {
    const shared: SisSectionMeeting[] = [
      { days: ["tue"], startTime: "13:00", endTime: "14:15" },
    ];
    const crosslist = {
      raw: "ANTH 1001/GWSS 1001/HIST 1001",
      partners: [],
      isPrimary: false,
    };
    const placed = placeSections([
      section(5, shared, { subject: "GWSS", crosslist }),
      section(3, shared, { subject: "HIST", crosslist }),
    ]);

    expect(placed.meetings.map(({ id }) => id)).toEqual(["s3:tue:1300"]);
  });

  it("a section with no set time goes to the tray, not the grid", () => {
    const placed = placeSections([section(1, [])]);

    expect(placed.meetings).toEqual([]);
    expect(placed.unscheduled.map(({ id }) => id)).toEqual([1]);
  });

  it("a weekend day is left undrawn, and the weekday beside it still draws", () => {
    const placed = placeSections([
      section(1, [
        { days: ["fri", "sat"], startTime: "09:00", endTime: "10:00" },
      ]),
    ]);

    expect(placed.meetings.map(({ id }) => id)).toEqual(["s1:fri:0900"]);
  });

  it("a block is named for where it sits, so a rewrite cannot rename its neighbors", () => {
    const twoPatterns = [
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
      { days: ["wed"], startTime: "13:00", endTime: "13:50" },
    ] satisfies SisSectionMeeting[];

    const placed = placeSections([section(1, twoPatterns)]);
    const reordered = placeSections([section(1, [...twoPatterns].reverse())]);

    expect(placed.meetings.map(({ id }) => id)).toEqual([
      "s1:mon:0900",
      "s1:wed:1300",
    ]);
    expect(reordered.meetings.map(({ id }) => id)).toEqual([
      "s1:wed:1300",
      "s1:mon:0900",
    ]);
  });

  it("a meeting past the grid's last hour is left undrawn", () => {
    const placed = placeSections([
      section(1, [{ days: ["mon"], startTime: "21:30", endTime: "22:30" }]),
    ]);

    expect(placed.meetings).toEqual([]);
  });
});
