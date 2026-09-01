import { describe, expect, it } from "vitest";
import {
  BASE_DAY_WIDTH,
  CREATE_GUTTER,
  dayIndexAt,
  layOutDay,
} from "./dayLayout";
import type { Meeting } from "../types";

const meeting = (
  id: string,
  startMinute: number,
  endMinute: number,
): Meeting => ({ id, dayIndex: 0, startMinute, endMinute });

describe("layOutDay", () => {
  it("back-to-back meetings share one lane", () => {
    const { width, placed } = layOutDay([
      meeting("a", 480, 530),
      meeting("b", 530, 580),
      meeting("c", 580, 630),
    ]);

    expect(placed.map(({ lane }) => lane)).toEqual([0, 0, 0]);
    expect(width).toBe(BASE_DAY_WIDTH + CREATE_GUTTER);
  });

  it("overlapping meetings split the day into lanes", () => {
    const { placed } = layOutDay([
      meeting("a", 540, 600),
      meeting("b", 570, 630),
    ]);

    expect(
      placed.map(({ meeting: { id }, lane, left }) => [id, lane, left]),
    ).toEqual([
      ["a", 0, 0],
      ["b", 1, 125],
    ]);
  });

  it("lane count is set by the busiest moment, not the meeting count", () => {
    const { placed } = layOutDay([
      meeting("a", 540, 600),
      meeting("b", 570, 630),
      meeting("c", 600, 660),
    ]);

    const laneCount = Math.max(...placed.map(({ lane }) => lane)) + 1;
    expect(laneCount).toBe(2);
  });
});

describe("dayIndexAt", () => {
  const widths = [282, 282, 250];

  it("walks the widths to the day under the offset", () => {
    expect(dayIndexAt(0, widths)).toBe(0);
    expect(dayIndexAt(281, widths)).toBe(0);
    expect(dayIndexAt(282, widths)).toBe(1);
    expect(dayIndexAt(700, widths)).toBe(2);
  });

  it("holds to the outermost day past either end", () => {
    expect(dayIndexAt(-40, widths)).toBe(0);
    expect(dayIndexAt(9000, widths)).toBe(2);
  });
});
