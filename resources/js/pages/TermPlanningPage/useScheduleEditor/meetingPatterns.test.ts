import { describe, expect, it } from "vitest";
import { withoutOverlaps, withPlacement } from "./meetingPatterns";
import type { SisSectionMeeting } from "../types";

/** Mon, Wed and Fri at 9, the shape most sections in the data have. */
const mwf: SisSectionMeeting[] = [
  { days: ["mon", "wed", "fri"], startTime: "09:00", endTime: "09:50" },
];

/** Thursday, 11:40 to 12:30, in the grid's terms. */
const thursdayLate = { dayIndex: 3, startMinute: 700, endMinute: 750 };

describe("withPlacement", () => {
  it("splits the day it moved out of the pattern it no longer agrees with", () => {
    const patterns = withPlacement(
      mwf,
      { day: "wed", startTime: "09:00" },
      thursdayLate,
    );

    expect(patterns).toEqual([
      { days: ["mon", "fri"], startTime: "09:00", endTime: "09:50" },
      { days: ["thu"], startTime: "11:40", endTime: "12:30" },
    ]);
  });

  it("moves a one-day pattern rather than leaving an empty one behind", () => {
    const patterns = withPlacement(
      [{ days: ["mon"], startTime: "09:00", endTime: "09:50" }],
      { day: "mon", startTime: "09:00" },
      thursdayLate,
    );

    expect(patterns).toEqual([
      { days: ["thu"], startTime: "11:40", endTime: "12:30" },
    ]);
  });

  it("joins a pattern the section already meets at, rather than repeating it", () => {
    const patterns = withPlacement(
      [
        { days: ["mon", "wed"], startTime: "09:00", endTime: "09:50" },
        { days: ["tue"], startTime: "13:00", endTime: "13:50" },
      ],
      { day: "wed", startTime: "09:00" },
      { dayIndex: 3, startMinute: 780, endMinute: 830 },
    );

    expect(patterns).toEqual([
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
      { days: ["tue", "thu"], startTime: "13:00", endTime: "13:50" },
    ]);
  });

  it("leaves the section's other patterns alone", () => {
    const patterns = withPlacement(
      [
        { days: ["mon"], startTime: "09:00", endTime: "09:50" },
        { days: ["wed"], startTime: "13:00", endTime: "13:50" },
      ],
      { day: "mon", startTime: "09:00" },
      thursdayLate,
    );

    expect(patterns[0]).toEqual({
      days: ["wed"],
      startTime: "13:00",
      endTime: "13:50",
    });
  });

  it("tells two patterns on the same day apart by their start time", () => {
    const patterns = withPlacement(
      [
        { days: ["mon"], startTime: "09:00", endTime: "09:50" },
        { days: ["mon"], startTime: "13:00", endTime: "13:50" },
      ],
      { day: "mon", startTime: "13:00" },
      thursdayLate,
    );

    expect(patterns).toEqual([
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
      { days: ["thu"], startTime: "11:40", endTime: "12:30" },
    ]);
  });
});

describe("withoutOverlaps", () => {
  it("leaves patterns that do not overlap alone", () => {
    const patterns: SisSectionMeeting[] = [
      { days: ["mon", "wed"], startTime: "09:00", endTime: "09:50" },
      { days: ["fri"], startTime: "13:00", endTime: "13:50" },
    ];

    expect(withoutOverlaps(patterns)).toEqual(patterns);
  });

  it("says one pattern once when a day repeats it", () => {
    const patterns: SisSectionMeeting[] = [
      { days: ["mon", "wed", "fri"], startTime: "09:45", endTime: "11:00" },
      { days: ["mon"], startTime: "09:45", endTime: "11:00" },
    ];

    expect(withoutOverlaps(patterns)).toEqual([
      { days: ["mon", "wed", "fri"], startTime: "09:45", endTime: "11:00" },
    ]);
  });

  it("runs two overlapping stretches of one day together", () => {
    const patterns: SisSectionMeeting[] = [
      { days: ["mon"], startTime: "09:00", endTime: "11:00" },
      { days: ["mon"], startTime: "09:45", endTime: "12:30" },
    ];

    expect(withoutOverlaps(patterns)).toEqual([
      { days: ["mon"], startTime: "09:00", endTime: "12:30" },
    ]);
  });

  it("merges a day's overlap without moving a day that had none", () => {
    const patterns: SisSectionMeeting[] = [
      { days: ["mon", "wed"], startTime: "09:00", endTime: "10:00" },
      { days: ["wed"], startTime: "09:30", endTime: "11:00" },
    ];

    expect(withoutOverlaps(patterns)).toEqual([
      { days: ["mon"], startTime: "09:00", endTime: "10:00" },
      { days: ["wed"], startTime: "09:00", endTime: "11:00" },
    ]);
  });

  it("leaves back-to-back times alone, since they do not overlap", () => {
    const patterns: SisSectionMeeting[] = [
      { days: ["mon"], startTime: "09:00", endTime: "10:00" },
      { days: ["mon"], startTime: "10:00", endTime: "11:00" },
    ];

    expect(withoutOverlaps(patterns)).toEqual(patterns);
  });

  it("gathers days that end up meeting at the same times", () => {
    const patterns: SisSectionMeeting[] = [
      { days: ["wed"], startTime: "09:00", endTime: "09:50" },
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
    ];

    expect(withoutOverlaps(patterns)).toEqual([
      { days: ["mon", "wed"], startTime: "09:00", endTime: "09:50" },
    ]);
  });
});
