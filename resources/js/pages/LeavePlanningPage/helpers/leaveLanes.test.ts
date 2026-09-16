import { describe, expect, it } from "vitest";
import { laneByDate } from "./leaveLanes";

const span = (startDate: string, endDate: string) => ({ startDate, endDate });

describe("laneByDate", () => {
  it("keeps leaves that follow one another in one lane", () => {
    const { laned, laneCount } = laneByDate([
      span("2027-01-19", "2027-05-12"),
      span("2026-09-08", "2026-12-23"),
    ]);

    expect(laneCount).toBe(1);
    expect(laned.map(({ lane }) => lane)).toEqual([0, 0]);
  });

  it("stacks overlapping leaves", () => {
    const { laned, laneCount } = laneByDate([
      span("2026-05-18", "2027-05-12"),
      span("2027-01-19", "2027-05-12"),
    ]);

    expect(laneCount).toBe(2);
    expect(laned.map(({ lane }) => lane)).toEqual([0, 1]);
  });

  it("stacks a leave that starts on the day another ends", () => {
    const { laneCount } = laneByDate([
      span("2026-09-08", "2026-12-23"),
      span("2026-12-23", "2027-01-10"),
    ]);

    expect(laneCount).toBe(2);
  });

  it("reuses the first lane that has come free", () => {
    const { laned } = laneByDate([
      span("2026-01-01", "2026-12-31"),
      span("2026-02-01", "2026-03-01"),
      span("2026-04-01", "2026-05-01"),
    ]);

    expect(laned.map(({ lane }) => lane)).toEqual([0, 1, 1]);
  });
});
