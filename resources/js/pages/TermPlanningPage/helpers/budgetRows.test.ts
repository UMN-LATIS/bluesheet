import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costPerson,
  gradJobCodeRate,
  jobCodeRate,
  rateOverrides,
  roundGradRates,
  sisInstructor,
} from "./costAssumptions.fixture";
import { budgetRowOf } from "./budgetRows";
import { plannedSection } from "./plannedSection.fixture";
import { estimateTermCost, type SectionCost } from "./termEstimate";
import type { PlannedSection } from "../types";

const labelOfSection = (sectionId: number) => `Label ${sectionId}`;

const assumptions = costAssumptions({
  gradRates: roundGradRates(),
  jobCodes: [
    jobCodeRate("A", 4000),
    gradJobCodeRate("TA", "teaching_assistant", "regular"),
    jobCodeRate("TBA", 5000, { instructorType: null }),
  ],
  people: [
    costPerson(1, ["A"]),
    costPerson(2, ["A"]),
    costPerson(10, ["TA"]),
    costPerson(20, ["TA"]),
    costPerson(21, ["TA"]),
  ],
});

const rowsOf = (sections: PlannedSection[]) => {
  const costs = estimateTermCost({
    sections,
    assumptions,
    rateOverrides: rateOverrides(),
  });

  return sections.map((section) =>
    budgetRowOf(section, costs.get(section.id), [], labelOfSection),
  );
};

const monday9 = [
  { days: ["mon" as const], startTime: "09:00", endTime: "09:50" },
];

describe("budgetRowOf", () => {
  it("labels the course with subject, catalog number and section", () => {
    const [row] = rowsOf([plannedSection(1, monday9)]);

    expect(row.courseLabel).toBe("ANTH 1001-001");
  });

  it("shows the days and time of the first meeting", () => {
    const [row] = rowsOf([plannedSection(1, monday9)]);

    expect(row.meetingSummary).toBe("M 9 – 9:50a");
  });

  it("shows Async for a section with no meetings", () => {
    const [row] = rowsOf([plannedSection(1, [])]);

    expect(row.meetingSummary).toBe("Async");
  });

  it("marks an unstaffed section TBA and costs it at the unstaffed cost", () => {
    const [row] = rowsOf([plannedSection(1, monday9)]);

    expect(row).toMatchObject({
      isUnstaffed: true,
      instructorName: "TBA",
      instructorCost: 5000,
    });
  });

  it("names a TA-only section as taught by a TA", () => {
    const [row] = rowsOf([
      plannedSection(1, monday9, { instructors: [sisInstructor(10, "TA")] }),
    ]);

    expect(row.instructorName).toBe("Taught by TA");
  });

  it("sums the instructor lines", () => {
    const [row] = rowsOf([
      plannedSection(1, monday9, {
        instructors: [sisInstructor(1, "PI"), sisInstructor(2, "PI")],
      }),
    ]);

    expect(row.instructorCost).toBe(8000);
  });

  it("points a lab's instructor cost at the lecture that pays it", () => {
    const pi = sisInstructor(1, "PI");
    const [lecture, lab] = rowsOf([
      plannedSection(1, monday9, { component: "LEC", instructors: [pi] }),
      plannedSection(2, monday9, {
        section: "002",
        component: "LAB",
        instructors: [pi],
      }),
    ]);

    expect(lecture.paidElsewhere).toBeNull();
    expect(lab.paidElsewhere?.sectionLabel).toBe("Label 1");
  });

  it("points an instructor charged at the same meeting time at the section that pays", () => {
    const pi = sisInstructor(1, "PI");
    const [regular, honors] = rowsOf([
      plannedSection(1, monday9, { instructors: [pi] }),
      plannedSection(2, monday9, {
        courseCode: "ANTH-1001H",
        instructors: [pi],
      }),
    ]);

    expect(regular.paidElsewhere).toBeNull();
    expect(honors.paidElsewhere).toEqual({
      sectionLabel: "Label 1",
      reason:
        "Paid on Label 1. It meets at the same time, and a person is paid once per meeting time.",
    });
  });

  it("leaves the instructor cost null when a line has no rate", () => {
    const section = plannedSection(1, monday9);
    const cost: SectionCost = {
      instructorCost: 0,
      taCost: 0,
      total: 0,
      lines: [
        {
          role: "instructor",
          emplid: 1,
          salary: null,
          fringe: null,
          amount: null,
          basis: { kind: "rate" },
        },
      ],
    };

    const row = budgetRowOf(section, cost, [], labelOfSection);

    expect(row.instructorCost).toBeNull();
  });

  it("flags a missing rate when the TA has no rate", () => {
    const section = plannedSection(1, monday9, {
      instructors: [sisInstructor(10, "TA")],
    });
    const cost: SectionCost = {
      instructorCost: 0,
      taCost: 0,
      total: 0,
      lines: [
        {
          role: "ta",
          emplid: 10,
          salary: null,
          fringe: null,
          amount: null,
          basis: { kind: "rate" },
        },
      ],
    };

    const row = budgetRowOf(section, cost, [], labelOfSection);

    expect(row.taCostCell).toEqual({ kind: "missingRate" });
  });

  it("lists a TA's last name on the section that is charged", () => {
    const ta = sisInstructor(10, "TA");
    const [lecture] = rowsOf([
      plannedSection(1, monday9, { component: "LEC", instructors: [ta] }),
    ]);

    expect(lecture.assistantNames).toBe("Last10");
    expect(lecture.taCostCell).toEqual({ kind: "amount", dollars: 9000 });
  });

  it("has an empty TA cell on a section with no TA", () => {
    const [row] = rowsOf([plannedSection(1, monday9)]);

    expect(row.taCostCell).toEqual({ kind: "none" });
  });

  it("shows a covered section's TA without a percent and where it is charged", () => {
    const ta = sisInstructor(10, "TA");
    const [lecture, discussion] = rowsOf([
      plannedSection(1, monday9, {
        component: "LEC",
        section: "001",
        instructors: [ta],
      }),
      plannedSection(
        2,
        [{ days: ["tue"], startTime: "09:00", endTime: "09:50" }],
        { component: "DIS", section: "002", instructors: [ta] },
      ),
    ]);

    expect(lecture.taCostCell).toEqual({ kind: "amount", dollars: 9000 });
    expect(discussion).toMatchObject({
      assistantNames: "Last10",
      taCostCell: {
        kind: "chargedOnOtherSection",
        sectionLabel: "Label 1",
        reason:
          "Paid on Label 1. A grad student's appointment is paid once per term.",
      },
    });
  });
});

describe("budgetRowOf TA cost cell", () => {
  it("shows the amount charged here when another TA is charged elsewhere", () => {
    const lecture = plannedSection(1, monday9, {
      section: "001",
      instructors: [sisInstructor(1, "PI"), sisInstructor(20, "TA")],
    });
    const discussion = plannedSection(2, monday9, {
      section: "002",
      component: "DIS",
      instructors: [sisInstructor(20, "TA"), sisInstructor(21, "TA")],
    });

    const [, row] = rowsOf([lecture, discussion]);

    expect(row.taCostCell).toEqual({ kind: "amount", dollars: 9000 });
  });

  it("shows nothing for a cancelled section that lists a TA", () => {
    const [row] = rowsOf([
      plannedSection(1, monday9, {
        isCancelled: true,
        instructors: [sisInstructor(20, "TA")],
      }),
    ]);

    expect(row.taCostCell).toEqual({ kind: "none" });
  });
});
