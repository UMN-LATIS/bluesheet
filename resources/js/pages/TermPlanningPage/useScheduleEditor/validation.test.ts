import { describe, expect, it } from "vitest";
import { sectionProblems } from "./validation";
import { plannedSection } from "../helpers/plannedSection.fixture";
import type { SisSectionMeeting } from "../types";

const meetings: SisSectionMeeting[] = [
  { days: ["mon"], startTime: "09:00", endTime: "09:50" },
];

describe("sectionProblems", () => {
  it("says nothing about a section that is fine", () => {
    expect(sectionProblems(plannedSection(1, meetings))).toEqual([]);
  });

  it("catches an end that is not after its start, and names the pattern", () => {
    const section = plannedSection(1, [
      { days: ["mon"], startTime: "09:00", endTime: "09:50" },
      { days: ["wed"], startTime: "13:00", endTime: "12:00" },
    ]);

    expect(sectionProblems(section)).toEqual([
      { patternIndex: 1, message: "End must be after start" },
    ]);
  });

  it("catches a cap that is not a whole number, zero or more", () => {
    const emptied = plannedSection(1, meetings, { enrollmentCap: NaN });
    const negative = plannedSection(1, meetings, { enrollmentCap: -1 });

    expect(sectionProblems(emptied)).toHaveLength(1);
    expect(sectionProblems(negative)).toHaveLength(1);
  });

  it("catches an emptied section number", () => {
    const section = plannedSection(1, meetings, { section: "  " });

    expect(sectionProblems(section)[0].message).toBe(
      "Section number cannot be empty",
    );
  });
});
