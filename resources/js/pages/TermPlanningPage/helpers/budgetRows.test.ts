import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costPerson,
  jobCodeRate,
  rateOverrides,
  sisInstructor,
  taAppointmentRate,
} from "./costAssumptions.fixture";
import type { CostLineOverride } from "@/types";
import { budgetRowOf, jobLabelsOf } from "./budgetRows";
import { lineOverridesByKeyOf } from "./costOverrides";
import { plannedSection } from "./plannedSection.fixture";
import { estimateTermCost, type SectionCost } from "./termEstimate";
import type { PlannedSection } from "../types";

const labelOfSection = (sectionId: number) => `Label ${sectionId}`;
const jobLabelOfEmplid = (emplid: number) => `Job of ${emplid}`;

const assumptions = costAssumptions({
  jobCodes: [
    jobCodeRate("A", 4000),
    jobCodeRate("TBA", 5000, { instructorType: null }),
  ],
  taRates: { fiscalYear: 2027, rates: [taAppointmentRate(9000)] },
  people: [costPerson(1, ["A"]), costPerson(2, ["A"])],
});

const rowsOf = (
  sections: PlannedSection[],
  lineOverrides: CostLineOverride[] = [],
) => {
  const costs = estimateTermCost({
    sections,
    assumptions,
    rateOverrides: rateOverrides(),
    lineOverridesByKey: lineOverridesByKeyOf(lineOverrides, {}),
  });

  return sections.map((section) =>
    budgetRowOf(
      section,
      costs.get(section.id),
      [],
      labelOfSection,
      jobLabelsOf(assumptions, rateOverrides()),
    ),
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

  it("describes the basis of the first instructor line", () => {
    const [row] = rowsOf([
      plannedSection(1, monday9, { instructors: [sisInstructor(1, "PI")] }),
    ]);

    expect(row.instructorBasisLabel).toBe("A Title A · FY27 rate");
    expect(row.instructorCost).toBe(4000);
  });

  it("shows each instructor's job code and title once under the names", () => {
    const [row] = rowsOf([
      plannedSection(1, monday9, {
        instructors: [sisInstructor(1, "PI"), sisInstructor(2, "PI")],
      }),
    ]);

    expect(row.instructorSubline).toBe("A · Title A");
  });

  it("explains the cost under TBA on an unstaffed section", () => {
    const [row] = rowsOf([plannedSection(1, monday9)]);

    expect(row.instructorSubline).toBe("No instructor yet · Unstaffed rate");
  });

  it("flags an instructor whose cost is overridden", () => {
    const [row] = rowsOf(
      [plannedSection(1, monday9, { instructors: [sisInstructor(1, "PI")] })],
      [
        {
          courseCode: "ANTH-1001",
          section: "001",
          emplid: 1,
          amount: 1234,
          reason: "Buyout",
        },
      ],
    );

    expect(row).toMatchObject({
      hasInstructorOverride: true,
      instructorCost: 1234,
      instructorBasisLabel: "Changed for this section, was $4,000 · Buyout",
    });
    expect(row.instructorLines).toEqual([
      {
        courseCode: "ANTH-1001",
        section: "001",
        emplid: 1,
        name: "Person 1",
        amount: 1234,
        defaultAmount: 4000,
        reason: "Buyout",
        isOverridden: true,
        paidOnLectureLabel: null,
      },
    ]);
  });

  it("lists no overridable instructor line on an unstaffed section", () => {
    const [row] = rowsOf([plannedSection(1, monday9)]);

    expect(row.instructorLines).toEqual([]);
  });

  it("lists a TA charged on the section as overridable, not one charged elsewhere", () => {
    const ta = sisInstructor(2, "TA");
    const [lecture, discussion] = rowsOf([
      plannedSection(1, monday9, { component: "LEC", instructors: [ta] }),
      plannedSection(2, monday9, {
        section: "002",
        component: "DIS",
        instructors: [ta],
      }),
    ]);

    expect(lecture.taLines).toMatchObject([
      { emplid: 2, amount: 9000, isOverridden: false },
    ]);
    expect(discussion.taLines).toEqual([]);
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

    expect(lecture.paidOnLectureLabel).toBeNull();
    expect(lab.paidOnLectureLabel).toBe("Label 1");
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
          amount: null,
          basis: { kind: "unratedJobCode", jobCode: "A" },
        },
      ],
    };

    const row = budgetRowOf(
      section,
      cost,
      [],
      labelOfSection,
      jobLabelOfEmplid,
    );

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
          amount: null,
          basis: {
            kind: "noTaRate",
            appointmentPercent: 25,
            season: "fall",
            studentStatus: "regular",
          },
        },
      ],
    };

    const row = budgetRowOf(
      section,
      cost,
      [],
      labelOfSection,
      jobLabelOfEmplid,
    );

    expect(row.taCostCell).toEqual({ kind: "missingRate" });
  });

  it("lists a TA's last name with the percent on the section that is charged", () => {
    const ta = sisInstructor(10, "TA");
    const [lecture] = rowsOf([
      plannedSection(1, monday9, { component: "LEC", instructors: [ta] }),
    ]);

    expect(lecture.assistantNames).toBe("Last10 25%");
    expect(lecture.taCostCell).toEqual({ kind: "amount", dollars: 9000 });
  });

  it("describes the basis of the TA appointment that is charged", () => {
    const ta = sisInstructor(10, "TA");
    const [lecture, discussion] = rowsOf([
      plannedSection(1, monday9, {
        component: "LEC",
        section: "001",
        instructors: [ta],
      }),
      plannedSection(2, monday9, {
        component: "DIS",
        section: "002",
        instructors: [ta],
      }),
    ]);

    expect(lecture.taBasisLabel).toBe("25% regular TA, fall · FY27 rate");
    expect(discussion.taBasisLabel).toBe("");
  });

  it("has an empty TA cell on a section with no TA", () => {
    const [row] = rowsOf([plannedSection(1, monday9)]);

    expect(row.taCostCell).toEqual({ kind: "none" });
    expect(row.taBasisLabel).toBe("");
  });

  it("shows a covered section's TA without a percent and where it is charged", () => {
    const ta = sisInstructor(10, "TA");
    const [lecture, discussion] = rowsOf([
      plannedSection(1, monday9, {
        component: "LEC",
        section: "001",
        instructors: [ta],
      }),
      plannedSection(2, monday9, {
        component: "DIS",
        section: "002",
        instructors: [ta],
      }),
    ]);

    expect(lecture.taCostCell).toEqual({ kind: "amount", dollars: 9000 });
    expect(discussion).toMatchObject({
      assistantNames: "Last10",
      taCostCell: { kind: "chargedOnOtherSection", sectionLabel: "Label 1" },
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

describe("jobLabelsOf", () => {
  const labelOf = (people: ReturnType<typeof costPerson>[]) =>
    jobLabelsOf(
      costAssumptions({ jobCodes: [jobCodeRate("A", 4000)], people }),
      rateOverrides(),
    );

  it("uses the admin's title for a job code entered in Nova", () => {
    const label = labelOf([costPerson(1, ["A"], { A: "Professor" })]);

    expect(label(1)).toBe("A · Title A");
  });

  it("falls back to the title on the person's appointment", () => {
    const label = labelOf([costPerson(1, ["9517"], { 9517: "Grad Instr" })]);

    expect(label(1)).toBe("9517 · Grad Instr");
  });

  it("shows the job code alone when no title is known", () => {
    expect(labelOf([costPerson(1, ["9702"])])(1)).toBe("9702");
  });

  it("says so when the person has no job code in the department", () => {
    expect(labelOf([])(1)).toBe("No job code in this department");
  });
});
