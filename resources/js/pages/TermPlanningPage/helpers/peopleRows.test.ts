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
import { lineOverridesByKeyOf } from "./costOverrides";
import { peopleGroupsOf } from "./peopleRows";
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
    costPerson(3, []),
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

const groupsOf = (sections: PlannedSection[]) =>
  peopleGroupsOf(
    sections,
    estimateTermCost({
      sections,
      assumptions,
      rateOverrides: rateOverrides(),
      lineOverridesByKey: lineOverridesByKeyOf([], {}),
    }),
    assumptions,
    roster,
    (emplid) => `Job of ${emplid}`,
  );

const roster: SisEmployee[] = [];

const pi = (emplid: number) => sisInstructor(emplid, "PI");

const employee = (emplid: number, name: string): SisEmployee => ({
  emplid,
  name,
  firstName: null,
  lastName: null,
  internetId: null,
  positionTitle: null,
  category: null,
});

describe("peopleGroupsOf", () => {
  it("groups people by the fund of their job code, leaving out empty groups", () => {
    const groups = groupsOf([
      section(1, { instructors: [pi(1)] }),
      section(2, { instructors: [pi(2), sisInstructor(10, "TA")] }),
      section(3, { instructors: [pi(3)] }),
    ]);

    expect(
      groups.map(({ fund, people }) => [fund, people.map((p) => p.emplid)]),
    ).toEqual([
      ["recurring", [1]],
      ["ui", [2]],
      ["taGi", [10]],
      ["unlisted", [3]],
    ]);
  });

  it("counts paid sections against half the annual load, rounded up", () => {
    const [recurring] = groupsOf([section(1, { instructors: [pi(1)] })]);

    expect(recurring.people[0]).toMatchObject({
      loadLabel: "1 of 2",
      isUnderLoad: true,
    });
  });

  it("does not count a lab paid on its lecture toward load", () => {
    const [recurring] = groupsOf([
      section(1, { component: "LEC", instructors: [pi(1)] }),
      section(2, {
        courseCode: "ANTH-1",
        catalogNumber: "1",
        component: "LAB",
        instructors: [pi(1)],
      }),
    ]);

    expect(recurring.people[0].loadLabel).toBe("1 of 2");
    expect(recurring.people[0].sections).toHaveLength(2);
  });

  it("shows a TA's appointment and cost", () => {
    const groups = groupsOf([
      section(1, { instructors: [pi(2), sisInstructor(10, "TA")] }),
    ]);
    const ta = groups.find(({ fund }) => fund === "taGi")?.people[0];

    expect(ta).toMatchObject({
      loadLabel: "25% appointment",
      isUnderLoad: false,
      cost: 9000,
    });
  });

  it("totals each group", () => {
    const groups = groupsOf([
      section(1, { instructors: [pi(2)] }),
      section(2, { instructors: [pi(2)] }),
    ]);

    expect(groups[0]).toMatchObject({ fund: "ui", total: 20000 });
  });

  it("lists a rostered person with a load and no sections as under load", () => {
    const groups = peopleGroupsOf(
      [],
      new Map(),
      assumptions,
      [employee(1, "Priya Raman"), employee(3, "Staff Person")],
      (emplid) => `Job of ${emplid}`,
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].people).toMatchObject([
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
      groupsOf([section(1, { isCancelled: true, instructors: [pi(1)] })]),
    ).toEqual([]);
  });
});
