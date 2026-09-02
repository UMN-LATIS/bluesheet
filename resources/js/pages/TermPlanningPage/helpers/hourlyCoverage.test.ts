import { describe, expect, it } from "vitest";
import { coverageByHour } from "./hourlyCoverage";
import type { Meeting } from "../types";

const meeting = (
  id: string,
  dayIndex: number,
  startMinute: number,
  endMinute: number,
  sectionId: number | null = null,
): Meeting => ({ id, dayIndex, sectionId, startMinute, endMinute });

const rowAt = (coverage: ReturnType<typeof coverageByHour>, hour: number) =>
  coverage.rows.find(({ startMinute }) => startMinute === hour * 60)!;

describe("coverageByHour", () => {
  it("counts every meeting during the hour, not the most at one moment", () => {
    // Three meetings touch 10–11, though never more than two at one moment.
    const coverage = coverageByHour(
      [
        meeting("a", 0, 600, 630),
        meeting("b", 0, 615, 660),
        meeting("c", 0, 630, 700),
      ],
      1,
    );

    expect(rowAt(coverage, 10).counts).toEqual([3]);
    expect(rowAt(coverage, 11).counts).toEqual([1]);
  });

  it("a meeting that ends as the hour starts is not in it", () => {
    const coverage = coverageByHour(
      [meeting("a", 0, 540, 600), meeting("b", 0, 600, 660)],
      1,
    );

    expect(rowAt(coverage, 9).counts).toEqual([1]);
    expect(rowAt(coverage, 10).counts).toEqual([1]);
  });

  it("a long meeting counts in every hour it crosses", () => {
    const coverage = coverageByHour([meeting("a", 0, 570, 750)], 1);

    expect(rowAt(coverage, 9).counts).toEqual([1]);
    expect(rowAt(coverage, 12).counts).toEqual([1]);
    expect(rowAt(coverage, 13).counts).toEqual([0]);
  });

  it("keeps days apart", () => {
    const coverage = coverageByHour(
      [meeting("a", 0, 540, 600), meeting("b", 2, 540, 600)],
      3,
    );

    expect(rowAt(coverage, 9).counts).toEqual([1, 0, 1]);
  });

  it("names the fullest hour", () => {
    const coverage = coverageByHour(
      [
        meeting("a", 1, 600, 660),
        meeting("b", 1, 600, 660),
        meeting("c", 0, 600, 660),
      ],
      2,
    );

    expect(coverage.busiest).toEqual({
      count: 2,
      dayIndex: 1,
      startMinute: 600,
    });
  });

  it("has no busiest hour when nothing meets", () => {
    expect(coverageByHour([], 5).busiest).toBeNull();
  });

  describe("the day totals", () => {
    it("count a section that meets twice in a day once", () => {
      const coverage = coverageByHour(
        [meeting("a", 0, 540, 600, 1), meeting("b", 0, 780, 840, 1)],
        1,
      );

      expect(rowAt(coverage, 9).counts).toEqual([1]);
      expect(rowAt(coverage, 13).counts).toEqual([1]);
      expect(coverage.dayTotals).toEqual([1]);
    });

    it("count sections, not the hours they fill", () => {
      const coverage = coverageByHour(
        [meeting("a", 0, 540, 750, 1), meeting("b", 0, 540, 600, 2)],
        1,
      );

      expect(coverage.dayTotals).toEqual([2]);
    });
  });

  describe("the hour bands", () => {
    it("run 8 AM through 7 PM", () => {
      const coverage = coverageByHour([], 1);

      expect(coverage.rows).toHaveLength(12);
      expect(coverage.rows[0].startMinute).toBe(8 * 60);
      expect(coverage.rows.at(-1)?.startMinute).toBe(19 * 60);
    });

    it("reach past 7 PM rather than hide an evening class", () => {
      const coverage = coverageByHour([meeting("a", 0, 1140, 1230)], 1);

      expect(coverage.rows.at(-1)?.startMinute).toBe(20 * 60);
      expect(rowAt(coverage, 20).counts).toEqual([1]);
    });

    it("stop at the end of the grid", () => {
      const coverage = coverageByHour([meeting("a", 0, 1200, 1260)], 1);

      expect(coverage.rows.at(-1)?.startMinute).toBe(20 * 60);
    });
  });
});
