import { describe, expect, it } from "vitest";
import {
  ASYNC_DAY_INDEX,
  DAY_TAB_NAMES,
  daysMetLabel,
  isAsyncDay,
} from "./scheduleDays";

describe("daysMetLabel", () => {
  it("runs the days together the way a schedule is written", () => {
    expect(daysMetLabel([{ days: ["mon", "wed", "fri"] }])).toBe("MWF");
  });

  it("keeps Thursday distinct from Tuesday", () => {
    expect(daysMetLabel([{ days: ["tue", "thu"] }])).toBe("TTh");
  });

  it("reads the week in order however the pattern lists it", () => {
    expect(daysMetLabel([{ days: ["fri", "mon"] }])).toBe("MF");
  });

  it("gathers every pattern, since a class can meet at two different hours", () => {
    expect(daysMetLabel([{ days: ["mon"] }, { days: ["wed"] }])).toBe("MW");
  });

  it("counts a day met twice only once", () => {
    expect(daysMetLabel([{ days: ["mon"] }, { days: ["mon"] }])).toBe("M");
  });

  it("calls a section with no meeting time Async", () => {
    expect(daysMetLabel([])).toBe("Async");
    expect(daysMetLabel([{ days: [] }])).toBe("Async");
  });

  it("leaves out a weekend day, which the schedule has no column for", () => {
    expect(daysMetLabel([{ days: ["mon", "sat"] }])).toBe("M");
  });
});

describe("the async day", () => {
  it("sits one past the last weekday", () => {
    expect(DAY_TAB_NAMES[ASYNC_DAY_INDEX]).toBe("Async");
    expect(isAsyncDay(ASYNC_DAY_INDEX)).toBe(true);
    expect(isAsyncDay(0)).toBe(false);
  });
});
