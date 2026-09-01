import { describe, expect, it } from "vitest";
import { formatClockWithHalf, formatTimeRange } from "./timeScale";

const at = (hours: number, minutes = 0) => hours * 60 + minutes;

describe("formatClockWithHalf", () => {
  it("drops the minutes on the hour", () => {
    expect(formatClockWithHalf(at(9))).toBe("9a");
    expect(formatClockWithHalf(at(13))).toBe("1p");
  });

  it("keeps them otherwise", () => {
    expect(formatClockWithHalf(at(10, 10))).toBe("10:10a");
  });

  it("counts noon as afternoon and midnight as morning", () => {
    expect(formatClockWithHalf(at(12))).toBe("12p");
    expect(formatClockWithHalf(at(0))).toBe("12a");
  });
});

describe("formatTimeRange", () => {
  it("marks the half once when the class stays inside one", () => {
    expect(formatTimeRange(at(9), at(11))).toBe("9 – 11a");
    expect(formatTimeRange(at(13), at(15, 30))).toBe("1 – 3:30p");
  });

  it("marks both ends when the class runs through noon", () => {
    expect(formatTimeRange(at(11, 15), at(13, 15))).toBe("11:15a – 1:15p");
  });

  it("treats a class ending at noon as crossing into the afternoon", () => {
    expect(formatTimeRange(at(11), at(12))).toBe("11a – 12p");
  });

  it("keeps the minutes that are not zero", () => {
    expect(formatTimeRange(at(8, 45), at(10, 45))).toBe("8:45 – 10:45a");
  });
});
