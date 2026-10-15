import { describe, expect, it } from "vitest";
import type { SisEmployee, TermLeave } from "@/types";
import type { PlannedSection } from "../types";
import {
  costAssumptions,
  costPerson,
  gradJobCodeRate,
  jobCodeRate,
  rateOverrides,
  ROUND_GRAD_INPUTS,
  roundGradRates,
  sisInstructor,
} from "./costAssumptions.fixture";
import type { PersonInputs } from "./personInputs";
import { gradPersonEditOf, peopleRowsOf, type PersonRow } from "./peopleRows";
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

const rowsOf = (
  sections: PlannedSection[],
  overrides = rateOverrides(),
  roster: SisEmployee[] = [],
  leavesByEmplid = new Map<number, TermLeave[]>(),
  inputsByEmplid = new Map<number, PersonInputs>(),
  withAssumptions = assumptions,
) =>
  peopleRowsOf(
    sections,
    estimateTermCost({
      sections,
      assumptions: withAssumptions,
      rateOverrides: overrides,
    }),
    withAssumptions,
    overrides,
    roster,
    leavesByEmplid,
    inputsByEmplid,
  );

const rowFor = (rows: PersonRow[], emplid: number) => {
  const row = rows.find((candidate) => candidate.emplid === emplid);
  if (row === undefined) throw new Error(`no row for ${emplid}`);

  return row;
};

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

describe("peopleRowsOf", () => {
  it("lists instructors and TAs in one list, sorted by last name", () => {
    const rows = rowsOf([
      section(1, { instructors: [pi(1)] }),
      section(2, { instructors: [pi(2), ta(10)] }),
    ]);

    expect(rows.map(({ emplid, isGrad }) => [emplid, isGrad])).toEqual([
      [1, false],
      [10, true],
      [2, false],
    ]);
  });

  it("puts the Unstaffed row after everyone, whatever the names", () => {
    const rows = rowsOf([
      section(1, {}),
      section(2, { instructors: [pi(2), ta(10)] }),
    ]);

    expect(rows.map(({ emplid }) => emplid)).toEqual([10, 2, null]);
  });

  it("shows a person's job code, title, fund, and salary per section", () => {
    const [row] = rowsOf([section(1, { instructors: [pi(2)] })]);

    expect(row).toMatchObject({
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

  it("adds fringe on top of the salary, per section, per term, and in the total", () => {
    const [row] = rowsOf([
      section(1, { instructors: [pi(4)] }),
      section(2, { instructors: [pi(4)] }),
    ]);

    expect(row).toMatchObject({
      salary: 6000,
      fringe: 3000,
      termSalary: 12000,
      termFringe: 6000,
      total: 18000,
    });
  });

  it("shows the planner's salary for a person, with fringe on top", () => {
    const overrides = rateOverrides({
      salaryByEmplid: new Map([[4, 8000]]),
    });
    const [row] = rowsOf([section(1, { instructors: [pi(4)] })], overrides);

    expect(row).toMatchObject({
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
    const [row] = rowsOf(
      [
        section(1, { instructors: [pi(2)] }),
        section(2, { instructors: [pi(2)] }),
      ],
      overrides,
    );

    expect(row).toMatchObject({
      salary: 12000,
      salaryWithoutOverride: 10000,
      isSalaryOverridden: true,
      total: 24000,
    });
  });

  it("titles a job code Nova does not list from the appointment", () => {
    const [row] = rowsOf([section(1, { instructors: [pi(3)] })]);

    expect(row).toMatchObject({
      jobCode: "9999",
      title: "Ph D Candidate Grad Instr",
      fundLabel: "—",
      salary: 5000,
    });
  });

  it("counts paid sections against half the annual load, rounded up", () => {
    const [row] = rowsOf([section(1, { instructors: [pi(1)] })]);

    expect(row).toMatchObject({
      loadLabel: "1",
      isUnderLoad: true,
    });
  });

  it("lists only paid sections, so a lab paid on its lecture is left out", () => {
    const [row] = rowsOf([
      section(1, { component: "LEC", instructors: [pi(1)] }),
      section(2, {
        courseCode: "ANTH-1",
        catalogNumber: "1",
        component: "LAB",
        instructors: [pi(1)],
      }),
    ]);

    expect(row).toMatchObject({
      loadLabel: "1",
      sections: [{ sectionId: 1, label: "1-001" }],
    });
  });

  it("shows a grad TA's pay as a read-only salary, on a 12.5% appointment for one section", () => {
    const rows = rowsOf([section(1, { instructors: [pi(2), ta(10)] })]);

    expect(rowFor(rows, 10)).toMatchObject({
      fundLabel: "TA/GI",
      salary: 4500,
      fringe: 0,
      total: 4500,
      isSalaryReadOnly: true,
      isSalaryOverridden: false,
      salaryHint: null,
      loadLabel: "12.5%",
      hasFeeOffset: false,
      isInternational: false,
      isAbd: false,
      isUnderLoad: false,
    });
  });

  it("lists every section a grad TA works, and sums the appointments they imply", () => {
    const rows = rowsOf([
      section(1, { courseCode: "ANTH-1", instructors: [ta(10)] }),
      section(2, { courseCode: "ANTH-1", instructors: [ta(10)] }),
      section(3, { courseCode: "ANTH-9", instructors: [ta(10)] }),
      section(4, { courseCode: "ANTH-8", instructors: [ta(10)] }),
      section(5, { courseCode: "ANTH-7", instructors: [ta(10)] }),
    ]);
    const row = rowFor(rows, 10);

    expect(row.sections.map(({ sectionId }) => sectionId)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(row.loadLabel).toBe("62.5%");
    expect(row.appointmentPercent).toBe(62.5);
    expect(row.total).toBe(22_500);
  });

  it("shows the flags, ABD status and the offset in the pay hint", () => {
    const overrides = rateOverrides({
      gradPeopleByEmplid: new Map([
        [
          10,
          {
            emplid: 10,
            hasFeeOffset: true,
            isInternational: true,
          },
        ],
      ]),
    });
    const rows = rowsOf(
      [section(1, { instructors: [ta(10)] })],
      overrides,
      [],
      new Map(),
      new Map(),
      costAssumptions({
        ...assumptions,
        gradRates: {
          ...roundGradRates(),
          defaults: {
            ...ROUND_GRAD_INPUTS,
            feeOffset: 200,
            internationalOffset: 400,
          },
        },
      }),
    );

    expect(rowFor(rows, 10)).toMatchObject({
      hasFeeOffset: true,
      isInternational: true,
      salary: 4650,
      salaryHint: "incl. $150 offset",
      loadLabel: "12.5%",
    });
  });

  it("marks an ABD TA", () => {
    const rows = rowsOf([section(1, { instructors: [ta(11)] })]);

    expect(rows[0]).toMatchObject({ jobCode: "9519", isAbd: true });
  });

  it("gives a grad instructor a read-only salary with the appointment and credits as the hint", () => {
    const [row] = rowsOf([section(1, { credits: 3, instructors: [pi(5)] })]);

    expect(row).toMatchObject({
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
    const rows = rowsOf([section(1, { instructors: [ta(10)] })], overrides);

    expect(rows[0]).toMatchObject({ salary: 4500, isSalaryOverridden: false });
  });

  it("leaves the grad fields empty for a non-grad instructor", () => {
    const [row] = rowsOf([section(1, { instructors: [pi(2)] })]);

    expect(row).toMatchObject({
      appointmentPercent: null,
      isSalaryReadOnly: false,
      salaryHint: null,
      hasFeeOffset: false,
    });
  });

  it("carries a person's note, and an empty note for everyone else", () => {
    const rows = rowsOf(
      [
        section(1, { instructors: [pi(2)] }),
        section(2, { instructors: [pi(1)] }),
      ],
      rateOverrides(),
      [],
      new Map(),
      new Map([
        [
          2,
          {
            notes: "Prefers mornings",
            yearStarted: null,
            courseReleases: null,
            releaseSource: null,
            expectedSections: null,
          },
        ],
      ]),
    );

    expect(rows.map(({ notes }) => notes)).toEqual(["", "Prefers mornings"]);
  });

  it("counts only sections led toward the load of someone who also TAs", () => {
    const [row] = rowsOf([
      section(1, { instructors: [pi(2)] }),
      section(2, { instructors: [ta(2)] }),
    ]);

    expect(row).toMatchObject({ emplid: 2, loadLabel: "1" });
  });

  it("ends the list with an Unstaffed row at the TBA rate", () => {
    const rows = rowsOf([
      section(1, { instructors: [pi(1)] }),
      section(2, {}),
      section(3, {}),
    ]);

    expect(rows.at(-1)).toMatchObject({
      emplid: null,
      name: "Unstaffed",
      jobCode: "TBA",
      salary: 5000,
      loadLabel: "2",
      total: 10000,
      sections: [{ sectionId: 2 }, { sectionId: 3 }],
    });
  });

  it("shows a non-grad's load as a count of paid sections and a grad's as the summed percent", () => {
    const rows = rowsOf([
      section(1, { instructors: [pi(1), ta(10)] }),
      section(2, { instructors: [pi(1), ta(10)] }),
    ]);

    expect(rowFor(rows, 1).loadLabel).toBe("2");
    expect(rowFor(rows, 10).loadLabel).toBe("25%");
  });

  it("sums a non-grad's salary and fringe over their paid sections", () => {
    const rows = rowsOf([
      section(1, { instructors: [pi(4)] }),
      section(2, { instructors: [pi(4)] }),
      section(3, { instructors: [pi(2)] }),
    ]);

    expect(rowFor(rows, 4)).toMatchObject({
      termSalary: 12000,
      termFringe: 6000,
    });
    expect(rowFor(rows, 2)).toMatchObject({ termSalary: 10000, termFringe: 0 });
  });

  it("sums a grad's term salary and fringe from their lines", () => {
    const rows = rowsOf([
      section(1, { instructors: [ta(10)] }),
      section(2, { instructors: [ta(10)] }),
    ]);

    expect(rowFor(rows, 10)).toMatchObject({
      termSalary: 9000,
      termFringe: 0,
    });
  });

  it("lists a rostered person with a load and no sections as under load", () => {
    const rows = rowsOf([], rateOverrides(), [
      employee(1, "Priya Raman"),
      employee(3, "Staff Person"),
    ]);

    expect(rows).toMatchObject([
      {
        emplid: 1,
        name: "Priya Raman",
        loadLabel: "0",
        isUnderLoad: true,
      },
    ]);
  });

  it("lists a rostered grad student with no assignments as an under-used TA", () => {
    const rows = rowsOf([], rateOverrides(), [employee(11, "Sam Grad")]);

    expect(rows).toMatchObject([
      {
        emplid: 11,
        isGrad: true,
        loadLabel: "0%",
        appointmentPercent: 0,
        isAssigned: false,
        total: 0,
        salary: null,
        isUnderLoad: true,
      },
    ]);
  });

  it("does not mark a TA with a course as under-used", () => {
    const rows = rowsOf([section(1, { instructors: [pi(1), ta(10)] })]);

    expect(rowFor(rows, 10)).toMatchObject({
      loadLabel: "12.5%",
      isAssigned: true,
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
      const rows = rowsOf([], rateOverrides(), [
        named(1, "Zoe", "Adams"),
        named(2, "Aaron", "Zimmer"),
      ]);

      expect(rows.map(({ name }) => name)).toEqual([
        "Adams, Zoe",
        "Zimmer, Aaron",
      ]);
    });

    it("keeps the single name when the first name is missing", () => {
      const [row] = rowsOf([], rateOverrides(), [
        { ...employee(1, "Adams Staff"), lastName: "Adams" },
      ]);

      expect(row.name).toBe("Adams Staff");
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
      const rows = rowsOf([], rateOverrides(), [], new Map([[1, [leave(1)]]]));

      expect(rows).toMatchObject([
        {
          emplid: 1,
          name: "On Leave 1",
          loadLabel: "0",
          isUnderLoad: false,
          total: 0,
          leaves: [{ id: 91 }],
        },
      ]);
    });

    it("attaches the leave to a person who also teaches", () => {
      const [row] = rowsOf(
        [section(1, { instructors: [pi(2)] })],
        rateOverrides(),
        [],
        new Map([[2, [leave(2)]]]),
      );

      expect(row).toMatchObject({ emplid: 2, total: 10000 });
      expect(row.leaves).toHaveLength(1);
    });
  });

  it("leaves cancelled sections out", () => {
    expect(
      rowsOf([section(1, { isCancelled: true, instructors: [pi(1)] })]),
    ).toEqual([]);
  });
});

describe("gradPersonEditOf", () => {
  const rowOfTa = (overrides = rateOverrides()) =>
    peopleRowsOf(
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
    )[0];

  it("keeps the person's other settings when one changes, and sends no appointment percent", () => {
    const row = rowOfTa(
      rateOverrides({
        gradPeopleByEmplid: new Map([
          [
            10,
            {
              emplid: 10,
              hasFeeOffset: false,
              isInternational: true,
            },
          ],
        ]),
      }),
    );

    expect(gradPersonEditOf(row, { hasFeeOffset: true })).toEqual({
      emplid: 10,
      hasFeeOffset: true,
      isInternational: true,
    });
  });

  it("is null for the Unstaffed row", () => {
    const [row] = rowsOf([section(1, {})]);

    expect(gradPersonEditOf(row, { isInternational: true })).toBeNull();
  });
});
