import { describe, expect, it } from "vitest";
import { coverageByHour } from "./hourlyCoverage";
import type { Meeting } from "../types";

const meeting = (
  id: string,
  dayIndex: number,
  startMinute: number,
  endMinute: number,
): Meeting => ({ id, dayIndex, sectionId: null, startMinute, endMinute });

const rowAt = (coverage: ReturnType<typeof coverageByHour>, hour: number) =>
  coverage.rows.find(({ startMinute }) => startMinute === hour * 60)!;

describe("coverageByHour", () => {
  it("counts the most meetings running at once within the hour", () => {
    // Three meetings touch 10–11, but never more than two at one moment.
    const coverage = coverageByHour(
      [
        meeting("a", 0, 600, 630),
        meeting("b", 0, 615, 660),
        meeting("c", 0, 630, 700),
      ],
      1,
    );

    expect(rowAt(coverage, 10).counts).toEqual([2]);
    expect(rowAt(coverage, 11).counts).toEqual([1]);
    expect(coverage.peak).toBe(2);
  });

  it("a meeting that ends as another starts does not overlap it", () => {
    const coverage = coverageByHour(
      [meeting("a", 0, 540, 600), meeting("b", 0, 600, 660)],
      1,
    );

    expect(rowAt(coverage, 9).counts).toEqual([1]);
    expect(rowAt(coverage, 10).counts).toEqual([1]);
  });

  it("keeps days apart and covers every hour of the grid", () => {
    const coverage = coverageByHour(
      [meeting("a", 0, 540, 600), meeting("b", 2, 540, 600)],
      3,
    );

    expect(rowAt(coverage, 9).counts).toEqual([1, 0, 1]);
    expect(coverage.rows).toHaveLength(13);
    expect(coverage.rows[0].startMinute).toBe(8 * 60);
  });

  it("a long meeting counts in every hour it crosses", () => {
    const coverage = coverageByHour([meeting("a", 0, 570, 750)], 1);

    expect(rowAt(coverage, 9).counts).toEqual([1]);
    expect(rowAt(coverage, 10).counts).toEqual([1]);
    expect(rowAt(coverage, 11).counts).toEqual([1]);
    expect(rowAt(coverage, 12).counts).toEqual([1]);
    expect(rowAt(coverage, 13).counts).toEqual([0]);
  });
});
