import { describe, expect, it } from "vitest";
import { toSectionPayload } from "./sectionPayload";
import { plannedSection } from "./plannedSection.fixture";

describe("toSectionPayload", () => {
  const section = plannedSection(
    7,
    [{ days: ["mon", "wed"], startTime: "10:10", endTime: "11:00" }],
    {
      notes: "needs a projector",
      instructors: [
        {
          emplid: 4242,
          role: "PI",
          name: "Ana García",
          lastName: "García",
          internetId: "garci123",
        },
      ],
    },
  );

  it("sends what a scheduler set", () => {
    expect(toSectionPayload(section)).toMatchObject({
      termId: 1269,
      courseCode: "ANTH-1001",
      section: "001",
      title: "Understanding Cultures",
      delivery: "onCampus",
      notes: "needs a projector",
      meetings: [
        { days: ["mon", "wed"], startTime: "10:10", endTime: "11:00" },
      ],
    });
  });

  it("leaves out what the server owns", () => {
    const payload = toSectionPayload(section);

    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("classNumber");
    expect(payload).not.toHaveProperty("enrollmentTotal");
    expect(payload).not.toHaveProperty("crosslist");
  });

  it("sends an instructor by emplid and role, not by the name it was shown", () => {
    expect(toSectionPayload(section).instructors).toEqual([
      { emplid: 4242, role: "PI" },
    ]);
  });
});
