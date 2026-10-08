import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costRuleSettings,
  jobCodeRate,
  personChoice,
  sisInstructor,
  taAppointmentRate,
} from "./costAssumptions.fixture";
import { budgetRowOf } from "./budgetRows";
import { plannedSection } from "./plannedSection.fixture";
import { estimateTermCost, type SectionCost } from "./termEstimate";
import type { PlannedSection } from "../types";

const labelOfSection = (sectionId: number) => `Label ${sectionId}`;

const assumptions = costAssumptions({
  jobCodes: [jobCodeRate("A", 4000)],
  taRates: { fiscalYear: 2027, rates: [taAppointmentRate(9000)] },
  people: [{ emplid: 1, jobCodes: ["A"] }],
});

const rowsOf = (
  sections: PlannedSection[],
  choices = [] as ReturnType<typeof personChoice>[],
) => {
  const costs = estimateTermCost({
    sections,
    assumptions: { ...assumptions, personChoices: choices },
    settings: costRuleSettings(),
  });

  return sections.map((section) =>
    budgetRowOf(section, costs.get(section.id), [], labelOfSection),
  );
};

const monday9 = [{ days: ["mon" as const], startTime: "09:00", endTime: "09:50" }];

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

  it("flags an instructor whose cost is overridden", () => {
    const [row] = rowsOf(
      [plannedSection(1, monday9, { instructors: [sisInstructor(1, "PI")] })],
      [personChoice(1, { overrideCost: 1234, overrideReason: "Buyout" })],
    );

    expect(row).toMatchObject({
      hasInstructorOverride: true,
      instructorCost: 1234,
      instructorBasisLabel: "Override: Buyout",
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
          amount: null,
          basis: { kind: "unratedJobCode", jobCode: "A" },
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

    const row = budgetRowOf(section, cost, [], labelOfSection);

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
      plannedSection(1, monday9, { component: "LEC", section: "001", instructors: [ta] }),
      plannedSection(2, monday9, { component: "DIS", section: "002", instructors: [ta] }),
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
      plannedSection(1, monday9, { component: "LEC", section: "001", instructors: [ta] }),
      plannedSection(2, monday9, { component: "DIS", section: "002", instructors: [ta] }),
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

