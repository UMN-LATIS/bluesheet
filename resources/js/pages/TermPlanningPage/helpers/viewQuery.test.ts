import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEW,
  decodeDayIndex,
  decodeView,
  encodeDayIndex,
} from "./viewQuery";
import { ASYNC_DAY_INDEX } from "./scheduleDays";

describe("decodeView", () => {
  it("reads a view the page has", () => {
    expect(decodeView({ view: "heatmap" })).toBe("heatmap");
  });

  it("falls back to the default view for a missing or unknown one", () => {
    expect(decodeView({})).toBe(DEFAULT_VIEW);
    expect(decodeView({ view: "gantt" })).toBe(DEFAULT_VIEW);
  });

  it("opens on the week", () => {
    expect(DEFAULT_VIEW).toBe("week");
  });
});

describe("encodeDayIndex", () => {
  it("round-trips every tab, Async included", () => {
    for (let dayIndex = 0; dayIndex <= ASYNC_DAY_INDEX; dayIndex++) {
      expect(decodeDayIndex({ day: encodeDayIndex(dayIndex) })).toBe(dayIndex);
    }
  });

  it("names days rather than numbering them", () => {
    expect(encodeDayIndex(1)).toBe("tue");
    expect(encodeDayIndex(ASYNC_DAY_INDEX)).toBe("async");
  });
});

describe("decodeDayIndex", () => {
  it("is null where the URL names no day, so the caller's default stands", () => {
    expect(decodeDayIndex({})).toBeNull();
    expect(decodeDayIndex({ day: "someday" })).toBeNull();
    expect(decodeDayIndex({ day: "2" })).toBeNull();
  });
});
