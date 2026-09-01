import { describe, expect, it } from "vitest";
import { placeSections } from "./sectionPlacement";
import type { SisSection, SisSectionMeeting } from "../types";

const section = (
  id: number,
  meetings: SisSectionMeeting[],
  extra: Partial<SisSection> = {},
): SisSection => ({
  id,
  classNumber: 50000 + id,
  termId: 1269,
  courseCode: "ANTH-1001",
  subject: "ANTH",
  catalogNumber: "1001",
  section: "001",
  title: "Understanding Cultures",
  component: "LEC",
  credits: 3,
  enrollmentCap: 30,
  enrollmentTotal: 20,
  waitlistCap: 5,
  waitlistTotal: 0,
  instructors: [],
  meetings,
  crosslist: null,
  ...extra,
});

describe("placeSections", () => {
  it("spreads one meeting pattern over each day it meets", () => {
    const placed = placeSections([
      section(1, [
        { days: ["mon", "wed"], startTime: "10:10", endTime: "11:00" },
      ]),
    ]);

    expect(placed.meetings).toEqual([
      { id: "s1:0:mon", dayIndex: 0, startMinute: 610, endMinute: 660 },
      { id: "s1:0:wed", dayIndex: 2, startMinute: 610, endMinute: 660 },
    ]);
    expect(placed.sectionsByMeetingId.get("s1:0:mon")?.id).toBe(1);
    expect(placed.shownCount).toBe(2);
    expect(placed.totalCount).toBe(2);
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

    expect(placed.meetings.map(({ id }) => id)).toEqual(["s1:0:tue"]);
    // The partner is the same block, so it adds nothing to either count.
    expect(placed.totalCount).toBe(1);
  });

  it("a section with no set time is counted, not drawn", () => {
    const placed = placeSections([section(1, [])]);

    expect(placed.meetings).toEqual([]);
    expect(placed.shownCount).toBe(0);
    expect(placed.totalCount).toBe(1);
  });

  it("weekend days are counted, not drawn", () => {
    const placed = placeSections([
      section(1, [
        { days: ["fri", "sat"], startTime: "09:00", endTime: "10:00" },
      ]),
    ]);

    expect(placed.meetings.map(({ id }) => id)).toEqual(["s1:0:fri"]);
    expect(placed.totalCount).toBe(2);
  });

  it("meetings outside the grid's hours are counted, not drawn", () => {
    const placed = placeSections([
      section(1, [{ days: ["mon"], startTime: "21:30", endTime: "22:30" }]),
    ]);

    expect(placed.meetings).toEqual([]);
    expect(placed.totalCount).toBe(1);
  });
});
