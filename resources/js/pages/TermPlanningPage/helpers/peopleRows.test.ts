import { describe, expect, it } from "vitest";
import type { SisEmployee, TermLeave } from "@/types";
import type { PlannedSection } from "../types";
import {
  costAssumptions,
  costPerson,
  gradJobCodeRate,
  jobCodeRate,
  rateOverrides,
  roundGradRates,
  sisInstructor,
} from "./costAssumptions.fixture";
import { gradPersonEditOf, peopleTablesOf } from "./peopleRows";
import { plannedSection } from "./plannedSection.fixture";
import { estimateTermCost } from "./termEstimate";

const assumptions = costAssumptions({
  gradRates: roundGradRates(),
  jobCodes: [
    jobCodeRate("9401", 0, {
      instructorType: "recurring_budget_faculty",
      annualLoad: 4,
    }),
    jobCodeRate("9753", 10000, {
      instructorType: "pa_instructor",
      annualLoad: 6,
    }),
    gradJobCodeRate("9511", "teaching_assistant", "regular"),
    gradJobCodeRate("9519", "teaching_assistant", "abd", { annualLoad: 2 }),
    gradJobCodeRate("9517", "graduate_instructor", "abd", {
      title: "Ph D Candidate Grad Instr",
    }),
    jobCodeRate("9760", 6000, { fringeRate: 0.5, annualLoad: 4 }),
    jobCodeRate("TBA", 5000, { instructorType: null }),
  ],
  people: [
    costPerson(1, ["9401"]),
    costPerson(2, ["9753"]),
    costPerson(3, ["9999"], { "9999": "Ph D Candidate Grad Instr" }),
    costPerson(5, ["9517"]),
    costPerson(4, ["9760"]),
    costPerson(10, ["9511"]),
    costPerson(11, ["9519"]),
  ],
});

const section = (id: number, extra: Partial<PlannedSection>) =>
  plannedSection(id, [], {
    section: String(id).padStart(3, "0"),
    courseCode: `ANTH-${id}`,
    catalogNumber: String(id),
    ...extra,
  });

const tablesOf = (
  sections: PlannedSection[],
  overrides = rateOverrides(),
  roster: SisEmployee[] = [],
  leavesByEmplid = new Map<number, TermLeave[]>(),
  notesByEmplid = new Map<number, string>(),
) =>
  peopleTablesOf(
    sections,
    estimateTermCost({
      sections,
      assumptions,
      rateOverrides: overrides,
    }),
    assumptions,
    overrides,
    roster,
    leavesByEmplid,
    notesByEmplid,
  );

const pi = (emplid: number) => sisInstructor(emplid, "PI");
const ta = (emplid: number) => sisInstructor(emplid, "TA");

const employee = (emplid: number, name: string): SisEmployee => ({
  emplid,
  name,
  firstName: null,
  lastName: null,
  internetId: null,
  positionTitle: null,
  category: null,
});

describe("peopleTablesOf", () => {
  it("puts TAs in their own table and instructors in the other", () => {
    const { instructors, tas } = tablesOf([
      section(1, { instructors: [pi(1)] }),
      section(2, { instructors: [pi(2), ta(10)] }),
    ]);

    expect(instructors.map(({ emplid }) => emplid)).toEqual([1, 2]);
    expect(tas.map(({ emplid }) => emplid)).toEqual([10]);
  });

  it("shows a person's job code, title, fund, and salary per section", () => {
    const { instructors } = tablesOf([section(1, { instructors: [pi(2)] })]);

    expect(instructors[0]).toMatchObject({
      jobCode: "9753",
      title: "Title 9753",
      fundLabel: "UI",
      salary: 10000,
      salaryWithoutOverride: 10000,
      isSalaryOverridden: false,
      fringe: 0,
      total: 10000,
    });
  });

  it("adds fringe on top of the salary, per section and in the total", () => {
    const { instructors } = tablesOf([
      section(1, { instructors: [pi(4)] }),
      section(2, { instructors: [pi(4)] }),
    ]);

    expect(instructors[0]).toMatchObject({
      salary: 6000,
      fringe: 3000,
      total: 18000,
    });
  });

  it("shows the planner's salary for a person, with fringe on top", () => {
    const overrides = rateOverrides({
      salaryByEmplid: new Map([[4, 8000]]),
    });
    const { instructors } = tablesOf(
      [section(1, { instructors: [pi(4)] })],
      overrides,
    );

    expect(instructors[0]).toMatchObject({
      salary: 8000,
      salaryWithoutOverride: 6000,
      isSalaryOverridden: true,
      fringe: 4000,
      total: 12000,
    });
  });

  it("shows the planner's salary for a person, and the salary it replaced", () => {
    const overrides = rateOverrides({
      salaryByEmplid: new Map([[2, 12000]]),
    });
    const { instructors } = tablesOf(
      [
        section(1, { instructors: [pi(2)] }),
        section(2, { instructors: [pi(2)] }),
      ],
      overrides,
    );

    expect(instructors[0]).toMatchObject({
      salary: 12000,
      salaryWithoutOverride: 10000,
      isSalaryOverridden: true,
      total: 24000,
    });
  });

  it("titles a job code Nova does not list from the appointment", () => {
    const { instructors } = tablesOf([section(1, { instructors: [pi(3)] })]);

    expect(instructors[0]).toMatchObject({
      jobCode: "9999",
      title: "Ph D Candidate Grad Instr",
      fundLabel: "—",
      salary: 5000,
    });
  });

  it("counts paid sections against half the annual load, rounded up", () => {
    const { instructors } = tablesOf([section(1, { instructors: [pi(1)] })]);

    expect(instructors[0]).toMatchObject({
      loadLabel: "1 of 2",
      isUnderLoad: true,
    });
  });

  it("lists only paid sections, so a lab paid on its lecture is left out", () => {
    const { instructors } = tablesOf([
      section(1, { component: "LEC", instructors: [pi(1)] }),
      section(2, {
        courseCode: "ANTH-1",
        catalogNumber: "1",
        component: "LAB",
        instructors: [pi(1)],
      }),
    ]);

    expect(instructors[0]).toMatchObject({
      loadLabel: "1 of 2",
      sections: [{ sectionId: 1, label: "1-001" }],
    });
  });

  it("shows a grad TA's pay as a read-only salary, on the default 25% appointment", () => {
    const { tas } = tablesOf([section(1, { instructors: [pi(2), ta(10)] })]);

    expect(tas[0]).toMatchObject({
      fundLabel: "TA/GI",
      salary: 9000,
      fringe: 0,
      total: 9000,
      isSalaryReadOnly: true,
      isSalaryOverridden: false,
      salaryHint: null,
      loadLabel: "25%",
      appointmentPercent: 25,
      isAppointmentOverridden: false,
      hasFeeOffset: false,
      isInternational: false,
      isAbd: false,
      isUnderLoad: false,
    });
  });

  it("lists every section a grad TA works, though the appointment is paid once", () => {
    const { tas } = tablesOf([
      section(1, { courseCode: "ANTH-1", instructors: [ta(10)] }),
      section(2, { courseCode: "ANTH-1", instructors: [ta(10)] }),
      section(3, { courseCode: "ANTH-9", instructors: [ta(10)] }),
    ]);

    expect(tas[0].sections.map(({ sectionId }) => sectionId)).toEqual([
      1, 2, 3,
    ]);
    expect(tas[0].total).toBe(9000);
    expect(tas[0].loadLabel).toBe("25%");
  });

  it("shows the person's appointment, flags, ABD status and the offset in the pay hint", () => {
    const overrides = rateOverrides({
      gradInputs: { feeOffset: 200, internationalOffset: 400 },
      gradPeopleByEmplid: new Map([
        [
          10,
          {
            emplid: 10,
            appointmentPercent: 50,
            hasFeeOffset: true,
            isInternational: true,
          },
        ],
      ]),
    });
    const { tas } = tablesOf(
      [section(1, { instructors: [ta(10)] })],
      overrides,
      [],
    );

    expect(tas[0]).toMatchObject({
      appointmentPercent: 50,
      isAppointmentOverridden: true,
      hasFeeOffset: true,
      isInternational: true,
      salary: 18_600,
      salaryHint: "incl. $600 offset",
      loadLabel: "50%",
    });
  });

  it("marks an ABD TA", () => {
    const { tas } = tablesOf([section(1, { instructors: [ta(11)] })]);

    expect(tas[0]).toMatchObject({ jobCode: "9519", isAbd: true });
  });

  it("gives a grad instructor a read-only salary with the appointment and credits as the hint", () => {
    const { instructors } = tablesOf([
      section(1, { credits: 3, instructors: [pi(5)] }),
    ]);

    expect(instructors[0]).toMatchObject({
      emplid: 5,
      salary: 9300,
      isSalaryReadOnly: true,
      salaryHint: "25% ABD · 3 credits",
      isAbd: true,
      appointmentPercent: 25,
    });
  });

  it("does not apply an instructor salary override to a TA", () => {
    const overrides = rateOverrides({ salaryByEmplid: new Map([[10, 99]]) });
    const { tas } = tablesOf(
      [section(1, { instructors: [ta(10)] })],
      overrides,
    );

    expect(tas[0]).toMatchObject({ salary: 9000, isSalaryOverridden: false });
  });

  it("leaves the grad fields empty for a non-grad instructor", () => {
    const { instructors } = tablesOf([section(1, { instructors: [pi(2)] })]);

    expect(instructors[0]).toMatchObject({
      appointmentPercent: null,
      isSalaryReadOnly: false,
      salaryHint: null,
      hasFeeOffset: false,
    });
  });

  it("carries a person's note, and an empty note for everyone else", () => {
    const { instructors } = tablesOf(
      [
        section(1, { instructors: [pi(2)] }),
        section(2, { instructors: [pi(1)] }),
      ],
      rateOverrides(),
      [],
      new Map(),
      new Map([[2, "Prefers mornings"]]),
    );

    expect(instructors.map(({ notes }) => notes)).toEqual([
      "",
      "Prefers mornings",
    ]);
  });

  it("counts only sections led toward the load of someone who also TAs", () => {
    const { instructors } = tablesOf([
      section(1, { instructors: [pi(2)] }),
      section(2, { instructors: [ta(2)] }),
    ]);

    expect(instructors[0]).toMatchObject({ emplid: 2, loadLabel: "1 of 3" });
  });

  it("ends the instructors with an Unstaffed row at the TBA rate", () => {
    const { instructors } = tablesOf([
      section(1, { instructors: [pi(1)] }),
      section(2, {}),
      section(3, {}),
    ]);

    expect(instructors.at(-1)).toMatchObject({
      emplid: null,
      name: "Unstaffed",
      jobCode: "TBA",
      salary: 5000,
      loadLabel: "2",
      total: 10000,
      sections: [{ sectionId: 2 }, { sectionId: 3 }],
    });
  });

  it("lists a rostered person with a load and no sections as under load", () => {
    const { instructors } = tablesOf([], rateOverrides(), [
      employee(1, "Priya Raman"),
      employee(3, "Staff Person"),
    ]);

    expect(instructors).toMatchObject([
      {
        emplid: 1,
        name: "Priya Raman",
        loadLabel: "0 of 2",
        isUnderLoad: true,
      },
    ]);
  });

  it("lists a rostered grad student with no assignments as an under-used TA", () => {
    const { instructors, tas } = tablesOf([], rateOverrides(), [
      employee(11, "Sam Grad"),
    ]);

    expect(instructors).toEqual([]);
    expect(tas).toMatchObject([
      {
        emplid: 11,
        loadLabel: "25%",
        total: 0,
        salary: null,
        isUnderLoad: true,
      },
    ]);
  });

  it("does not mark a TA with a course as under-used", () => {
    const { tas } = tablesOf([section(1, { instructors: [pi(1), ta(10)] })]);

    expect(tas[0]).toMatchObject({
      loadLabel: "25%",
      isUnderLoad: false,
    });
  });

  describe("names", () => {
    const named = (
      emplid: number,
      firstName: string | null,
      lastName: string | null,
    ): SisEmployee => ({
      ...employee(emplid, `${firstName} ${lastName}`),
      firstName,
      lastName,
    });

    it("shows Lastname, Firstname and sorts by last name", () => {
      const { instructors } = tablesOf([], rateOverrides(), [
        named(1, "Zoe", "Adams"),
        named(2, "Aaron", "Zimmer"),
      ]);

      expect(instructors.map(({ name }) => name)).toEqual([
        "Adams, Zoe",
        "Zimmer, Aaron",
      ]);
    });

    it("keeps the single name when the first name is missing", () => {
      const { instructors } = tablesOf([], rateOverrides(), [
        { ...employee(1, "Adams Staff"), lastName: "Adams" },
      ]);

      expect(instructors[0].name).toBe("Adams Staff");
    });
  });

  describe("with leaves", () => {
    const leave = (emplid: number): TermLeave => ({
      id: 90 + emplid,
      userId: 900 + emplid,
      emplid,
      name: `On Leave ${emplid}`,
      lastName: "Leave",
      type: "sabbatical",
      status: "confirmed",
      startDate: "2026-08-31",
      endDate: "2027-05-31",
    });

    it("lists a person on leave who teaches nothing, not as under load", () => {
      const { instructors } = tablesOf(
        [],
        rateOverrides(),
        [],
        new Map([[1, [leave(1)]]]),
      );

      expect(instructors).toMatchObject([
        {
          emplid: 1,
          name: "On Leave 1",
          loadLabel: "0 of 2",
          isUnderLoad: false,
          total: 0,
          leaves: [{ id: 91 }],
        },
      ]);
    });

    it("attaches the leave to a person who also teaches", () => {
      const { instructors } = tablesOf(
        [section(1, { instructors: [pi(2)] })],
        rateOverrides(),
        [],
        new Map([[2, [leave(2)]]]),
      );

      expect(instructors[0]).toMatchObject({ emplid: 2, total: 10000 });
      expect(instructors[0].leaves).toHaveLength(1);
    });
  });

  it("leaves cancelled sections out", () => {
    expect(
      tablesOf([section(1, { isCancelled: true, instructors: [pi(1)] })]),
    ).toEqual({ instructors: [], tas: [] });
  });
});

describe("gradPersonEditOf", () => {
  const rowOfTa = (overrides = rateOverrides()) =>
    peopleTablesOf(
      [section(1, { instructors: [ta(10)] })],
      estimateTermCost({
        sections: [section(1, { instructors: [ta(10)] })],
        assumptions,
        rateOverrides: overrides,
      }),
      assumptions,
      overrides,
      [],
      new Map(),
      new Map(),
    ).tas[0];

  it("keeps the person's other settings when one changes", () => {
    const row = rowOfTa(
      rateOverrides({
        gradPeopleByEmplid: new Map([
          [
            10,
            {
              emplid: 10,
              appointmentPercent: 50,
              hasFeeOffset: false,
              isInternational: true,
            },
          ],
        ]),
      }),
    );

    expect(gradPersonEditOf(row, { hasFeeOffset: true })).toEqual({
      emplid: 10,
      appointmentPercent: 50,
      hasFeeOffset: true,
      isInternational: true,
    });
  });

  it("is null for the Unstaffed row", () => {
    const { instructors } = tablesOf([section(1, {})]);

    expect(
      gradPersonEditOf(instructors[0], { isInternational: true }),
    ).toBeNull();
  });
});
