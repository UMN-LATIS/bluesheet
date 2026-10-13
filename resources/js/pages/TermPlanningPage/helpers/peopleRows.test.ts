import { describe, expect, it } from "vitest";
import type { SisEmployee } from "@/types";
import type { PlannedSection } from "../types";
import {
  costAssumptions,
  costPerson,
  jobCodeRate,
  rateOverrides,
  sisInstructor,
  taAppointmentRate,
} from "./costAssumptions.fixture";
import { lineOverrideAmountsByKeyOf } from "./costOverrides";
import { peopleTablesOf } from "./peopleRows";
import { plannedSection } from "./plannedSection.fixture";
import { estimateTermCost } from "./termEstimate";

const assumptions = costAssumptions({
  jobCodes: [
    jobCodeRate("9401", 0, {
      instructorType: "recurring_budget_faculty",
      annualLoad: 4,
    }),
    jobCodeRate("9753", 10000, {
      instructorType: "pa_instructor",
      annualLoad: 6,
    }),
    jobCodeRate("TBA", 5000, { instructorType: null }),
  ],
  people: [
    costPerson(1, ["9401"]),
    costPerson(2, ["9753"]),
    costPerson(3, ["9517"], { "9517": "Ph D Candidate Grad Instr" }),
    costPerson(10, ["9511"]),
  ],
  taRates: { fiscalYear: 2027, rates: [taAppointmentRate(9000)] },
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
) =>
  peopleTablesOf(
    sections,
    estimateTermCost({
      sections,
      assumptions,
      rateOverrides: overrides,
      lineOverrideAmountsByKey: lineOverrideAmountsByKeyOf([], {}),
    }),
    assumptions,
    overrides,
    roster,
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

  it("shows a person's job code, title, fund, and rate per section", () => {
    const { instructors } = tablesOf([section(1, { instructors: [pi(2)] })]);

    expect(instructors[0]).toMatchObject({
      jobCode: "9753",
      title: "Title 9753",
      fundLabel: "UI",
      rate: 10000,
      rateWithoutOverride: 10000,
      isRateOverridden: false,
      total: 10000,
    });
  });

  it("shows the planner's rate for a person, and the rate it replaced", () => {
    const overrides = rateOverrides({
      costPerSectionByEmplid: new Map([[2, 12000]]),
    });
    const { instructors } = tablesOf(
      [
        section(1, { instructors: [pi(2)] }),
        section(2, { instructors: [pi(2)] }),
      ],
      overrides,
    );

    expect(instructors[0]).toMatchObject({
      rate: 12000,
      rateWithoutOverride: 10000,
      isRateOverridden: true,
      total: 24000,
    });
  });

  it("titles a job code Nova does not list from the appointment", () => {
    const { instructors } = tablesOf([section(1, { instructors: [pi(3)] })]);

    expect(instructors[0]).toMatchObject({
      jobCode: "9517",
      title: "Ph D Candidate Grad Instr",
      fundLabel: "—",
      rate: 5000,
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
      paidSections: [{ sectionId: 1, label: "1-001" }],
    });
  });

  it("shows a TA's appointment and their rate per course", () => {
    const { tas } = tablesOf([section(1, { instructors: [pi(2), ta(10)] })]);

    expect(tas[0]).toMatchObject({
      fundLabel: "TA/GI",
      rate: 9000,
      loadLabel: "25%",
      isUnderLoad: false,
      total: 9000,
    });
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
      rate: 5000,
      loadLabel: "2",
      total: 10000,
      paidSections: [{ sectionId: 2 }, { sectionId: 3 }],
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

  it("leaves cancelled sections out", () => {
    expect(
      tablesOf([section(1, { isCancelled: true, instructors: [pi(1)] })]),
    ).toEqual({ instructors: [], tas: [] });
  });
});
