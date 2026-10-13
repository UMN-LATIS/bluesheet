import { describe, expect, it } from "vitest";
import type { CostPerson, PersonChoice } from "@/types";
import type { PlannedSection } from "../types";
import {
  costAssumptions,
  costPerson,
  costRuleSettings,
  jobCodeRate,
  personChoice,
  sisInstructor,
  taAppointmentRate,
} from "./costAssumptions.fixture";
import type { CostRuleSettings } from "./costRules";
import { estimateTermCost, totalsOf } from "./termEstimate";
import { plannedSection } from "./plannedSection.fixture";

const section = (id: number, extra: Partial<PlannedSection> = {}) =>
  plannedSection(id, [], { section: String(id).padStart(3, "0"), ...extra });

const people: CostPerson[] = [
  costPerson(1, ["A"]),
  costPerson(2, ["B"]),
  costPerson(3, ["R"]),
  costPerson(10, []),
  costPerson(11, []),
];

const assumptions = costAssumptions({
  jobCodes: [
    jobCodeRate("A", 4000),
    jobCodeRate("B", 6000),
    jobCodeRate("R", 8000, { instructorType: "recurring_budget_faculty" }),
  ],
  taRates: { fiscalYear: 2027, rates: [taAppointmentRate(9000)] },
  people,
});

const estimate = (
  sections: PlannedSection[],
  settings: CostRuleSettings = costRuleSettings(),
  choices: PersonChoice[] = [],
  withAssumptions = assumptions,
) =>
  estimateTermCost({
    sections,
    assumptions: { ...withAssumptions, personChoices: choices },
    settings,
  });

describe("estimateTermCost", () => {
  it("costs a section with a PI at the PI's job code rate", () => {
    const costs = estimate([
      section(1, { instructors: [sisInstructor(1, "PI")] }),
    ]);

    expect(costs.get(1)).toMatchObject({
      instructorCost: 4000,
      taCost: 0,
      total: 4000,
    });
    expect(costs.get(1)?.lines).toHaveLength(1);
  });

  it("adds the totals across sections", () => {
    const costs = estimate([
      section(1, { instructors: [sisInstructor(1, "PI")] }),
      section(2, {
        courseCode: "ANTH-2001",
        instructors: [sisInstructor(2, "PI")],
      }),
    ]);

    expect(totalsOf([...costs.values()]).total).toBe(10000);
  });

  it("costs team-taught PIs each at their own rate", () => {
    const costs = estimate([
      section(1, {
        instructors: [sisInstructor(1, "PI"), sisInstructor(2, "PI")],
      }),
    ]);

    expect(
      costs.get(1)?.lines.map(({ emplid, amount }) => [emplid, amount]),
    ).toEqual([
      [1, 4000],
      [2, 6000],
    ]);
    expect(costs.get(1)?.total).toBe(10000);
  });

  it("costs a section with no instructors at the unstaffed section cost", () => {
    const costs = estimate([section(1)]);

    expect(costs.get(1)?.lines).toEqual([
      {
        role: "unstaffedSection",
        emplid: null,
        amount: 5000,
        basis: { kind: "unstaffedSection" },
      },
    ]);
    expect(costs.get(1)?.instructorCost).toBe(5000);
  });

  it("gives a TA-only section a TA line and no instructor cost", () => {
    const costs = estimate([
      section(1, { instructors: [sisInstructor(10, "TA")] }),
    ]);

    expect(costs.get(1)?.lines.map(({ role }) => role)).toEqual(["ta"]);
    expect(costs.get(1)).toMatchObject({
      instructorCost: 0,
      taCost: 9000,
      total: 9000,
    });
  });

  it("charges a TA once, on the lecture, across a lecture and two discussions", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { section: "001", component: "DIS", instructors: [ta] }),
      section(2, { section: "002", component: "DIS", instructors: [ta] }),
      section(3, { section: "010", component: "LEC", instructors: [ta] }),
    ]);

    expect(costs.get(3)?.lines[0]).toMatchObject({ amount: 9000 });
    expect(costs.get(3)?.lines[0].basis.kind).toBe("taAppointment");
    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 0,
      basis: { kind: "chargedOnOtherSection", sectionId: 3 },
    });
    expect(costs.get(2)?.lines[0]).toMatchObject({
      amount: 0,
      basis: { kind: "chargedOnOtherSection", sectionId: 3 },
    });
    expect(totalsOf([...costs.values()]).taCost).toBe(9000);
  });

  it("charges a TA on the lowest section number when the course has no lecture", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { section: "003", component: "DIS", instructors: [ta] }),
      section(2, { section: "001", component: "DIS", instructors: [ta] }),
    ]);

    expect(costs.get(2)?.lines[0].amount).toBe(9000);
    expect(costs.get(1)?.lines[0].basis).toEqual({
      kind: "chargedOnOtherSection",
      sectionId: 2,
    });
  });

  it("charges the same TA once per course", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { courseCode: "ANTH-1001", instructors: [ta] }),
      section(2, { courseCode: "ANTH-2001", instructors: [ta] }),
    ]);

    expect(costs.get(1)?.taCost).toBe(9000);
    expect(costs.get(2)?.taCost).toBe(9000);
  });

  it("gives a cancelled section no lines and a total of zero", () => {
    const costs = estimate([
      section(1, { isCancelled: true, instructors: [sisInstructor(1, "PI")] }),
    ]);

    expect(costs.get(1)).toEqual({
      lines: [],
      instructorCost: 0,
      taCost: 0,
      total: 0,
    });
  });

  it("charges a TA on the live section when the other section is cancelled", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { section: "001", isCancelled: true, instructors: [ta] }),
      section(2, { section: "002", instructors: [ta] }),
    ]);

    expect(costs.get(1)?.total).toBe(0);
    expect(costs.get(2)?.taCost).toBe(9000);
  });

  it("costs an IND section with a PI nothing when independent study is free", () => {
    const costs = estimate(
      [section(1, { component: "IND", instructors: [sisInstructor(1, "PI")] })],
      costRuleSettings({ isIndependentStudyFree: true }),
    );

    expect(costs.get(1)?.total).toBe(0);
    expect(costs.get(1)?.lines[0]).toMatchObject({
      role: "instructor",
      emplid: 1,
      amount: 0,
      basis: { kind: "freeComponent", component: "IND" },
    });
  });

  it("costs an IND section with a PI the PI's rate when independent study is not free", () => {
    const costs = estimate([
      section(1, { component: "IND", instructors: [sisInstructor(1, "PI")] }),
    ]);

    expect(costs.get(1)?.total).toBe(4000);
  });

  it("gives a free IND section with no instructors a zero unstaffed line", () => {
    const costs = estimate(
      [section(1, { component: "IND" })],
      costRuleSettings({ isIndependentStudyFree: true }),
    );

    expect(costs.get(1)?.lines).toEqual([
      {
        role: "unstaffedSection",
        emplid: null,
        amount: 0,
        basis: { kind: "freeComponent", component: "IND" },
      },
    ]);
  });

  it("charges a TA on the LEC when they also appear on a free IND section of the course", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate(
      [
        section(1, { section: "001", component: "IND", instructors: [ta] }),
        section(2, { section: "002", component: "LEC", instructors: [ta] }),
      ],
      costRuleSettings({ isIndependentStudyFree: true }),
    );

    expect(costs.get(2)?.taCost).toBe(9000);
    expect(costs.get(1)?.lines[0].basis.kind).toBe("freeComponent");
    expect(costs.get(1)?.total).toBe(0);
  });

  it("leaves the amount null and out of the totals when the TA rate is missing", () => {
    const costs = estimate(
      [
        section(1, {
          instructors: [sisInstructor(1, "PI"), sisInstructor(10, "TA")],
        }),
      ],
      costRuleSettings({ taAppointmentPercent: 50 }),
    );

    const taLine = costs.get(1)?.lines[1];
    expect(taLine).toMatchObject({ role: "ta", amount: null });
    expect(taLine?.basis.kind).toBe("noTaRate");

    expect(totalsOf([...costs.values()])).toMatchObject({
      total: 4000,
      taCost: 0,
      missingRateCount: 1,
    });
  });

  it("prices a person absent from assumptions.people at the unrated job code cost", () => {
    const costs = estimate([
      section(1, { instructors: [sisInstructor(99, "PI")] }),
    ]);

    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 7000,
      basis: { kind: "unratedJobCode", jobCode: null },
    });
  });

  it("prices a TA with an override at the override", () => {
    const costs = estimate(
      [section(1, { instructors: [sisInstructor(10, "TA")] })],
      costRuleSettings(),
      [personChoice(10, { overrideCost: 1000 })],
    );

    expect(costs.get(1)?.taCost).toBe(1000);
  });
});

describe("estimateTermCost with labs and discussions in a lecture course", () => {
  const pi = (emplid: number) => sisInstructor(emplid, "PI");

  it("charges a PI once, on the lecture, across a lecture and two labs", () => {
    const costs = estimate([
      section(1, { section: "001", component: "LEC", instructors: [pi(1)] }),
      section(2, { section: "002", component: "LAB", instructors: [pi(1)] }),
      section(3, { section: "003", component: "LAB", instructors: [pi(1)] }),
    ]);

    expect(costs.get(1)?.total).toBe(4000);
    for (const id of [2, 3]) {
      expect(costs.get(id)?.lines).toEqual([
        {
          role: "instructor",
          emplid: 1,
          amount: 0,
          basis: { kind: "paidOnLecture", component: "LAB" },
        },
      ]);
      expect(costs.get(id)?.total).toBe(0);
    }
    expect(totalsOf([...costs.values()]).total).toBe(4000);
  });

  it("costs a different PI on a discussion of a lecture course at nothing", () => {
    const costs = estimate([
      section(1, { section: "001", component: "LEC", instructors: [pi(1)] }),
      section(2, { section: "002", component: "DIS", instructors: [pi(2)] }),
    ]);

    expect(costs.get(2)?.lines[0]).toMatchObject({
      emplid: 2,
      amount: 0,
      basis: { kind: "paidOnLecture", component: "DIS" },
    });
    expect(costs.get(2)?.total).toBe(0);
  });

  it("costs any other non-lecture component of a lecture course at nothing", () => {
    const costs = estimate([
      section(1, { section: "001", component: "LEC", instructors: [pi(1)] }),
      section(2, { section: "002", component: "SEM", instructors: [pi(2)] }),
    ]);

    expect(costs.get(2)?.lines[0].basis).toEqual({
      kind: "paidOnLecture",
      component: "SEM",
    });
    expect(costs.get(2)?.total).toBe(0);
  });

  it("charges each section's PI in a course with only labs", () => {
    const costs = estimate([
      section(1, { section: "001", component: "LAB", instructors: [pi(1)] }),
      section(2, { section: "002", component: "LAB", instructors: [pi(1)] }),
    ]);

    expect(costs.get(1)?.total).toBe(4000);
    expect(costs.get(2)?.total).toBe(4000);
  });

  it("charges lab PIs when the course's only lecture is cancelled", () => {
    const costs = estimate([
      section(1, {
        section: "001",
        component: "LEC",
        isCancelled: true,
        instructors: [pi(1)],
      }),
      section(2, { section: "002", component: "LAB", instructors: [pi(1)] }),
    ]);

    expect(costs.get(2)?.total).toBe(4000);
    expect(costs.get(2)?.lines[0].basis.kind).toBe("jobCodeRate");
  });

  it("costs an unstaffed lab in a lecture course at nothing", () => {
    const costs = estimate([
      section(1, { section: "001", component: "LEC", instructors: [pi(1)] }),
      section(2, { section: "002", component: "LAB" }),
    ]);

    expect(costs.get(2)?.lines).toEqual([
      {
        role: "unstaffedSection",
        emplid: null,
        amount: 0,
        basis: { kind: "paidOnLecture", component: "LAB" },
      },
    ]);
    expect(costs.get(2)?.total).toBe(0);
  });
});

describe("totalsOf", () => {
  it("sums instructor, TA, and total cost over sections", () => {
    const costs = estimate([
      section(1, {
        instructors: [sisInstructor(1, "PI"), sisInstructor(10, "TA")],
      }),
      section(2, {
        courseCode: "ANTH-2001",
        instructors: [sisInstructor(2, "PI")],
      }),
    ]);

    expect(totalsOf([...costs.values()])).toMatchObject({
      instructorCost: 10000,
      taCost: 9000,
      total: 19000,
      missingRateCount: 0,
    });
  });

  it("counts a person with overrides on two sections once", () => {
    const costs = estimate(
      [
        section(1, { instructors: [sisInstructor(1, "PI")] }),
        section(2, {
          courseCode: "ANTH-2001",
          instructors: [sisInstructor(1, "PI")],
        }),
        section(3, {
          courseCode: "ANTH-3001",
          instructors: [sisInstructor(2, "PI")],
        }),
      ],
      costRuleSettings(),
      [personChoice(1, { overrideCost: 0 })],
    );

    expect(totalsOf([...costs.values()]).overrideCount).toBe(1);
  });

  it("counts two people with overrides as two", () => {
    const costs = estimate(
      [
        section(1, {
          instructors: [sisInstructor(1, "PI"), sisInstructor(2, "PI")],
        }),
      ],
      costRuleSettings(),
      [
        personChoice(1, { overrideCost: 0 }),
        personChoice(2, { overrideCost: 100 }),
      ],
    );

    expect(totalsOf([...costs.values()]).overrideCount).toBe(2);
  });

  it("counts sections with a recurring budget line, once each", () => {
    const costs = estimate(
      [
        section(1, { instructors: [sisInstructor(3, "PI")] }),
        section(2, {
          courseCode: "ANTH-2001",
          instructors: [sisInstructor(3, "PI"), sisInstructor(10, "TA")],
        }),
        section(3, {
          courseCode: "ANTH-3001",
          instructors: [sisInstructor(1, "PI")],
        }),
      ],
      costRuleSettings({ isRecurringBudgetFree: true }),
    );

    expect(totalsOf([...costs.values()])).toMatchObject({
      recurringBudgetSectionCount: 2,
      total: 4000 + 9000,
    });
  });
});

describe("estimateTermCost with crosslisted sections", () => {
  const crosslist = (isPrimary: boolean) => ({
    raw: "ANTH 4001-001/ANTH 8001-001",
    partners: [],
    isPrimary,
  });

  it("charges a crosslisted pair once, on the primary partner", () => {
    const costs = estimate([
      section(1, {
        instructors: [sisInstructor(1, "PI")],
        crosslist: crosslist(false),
      }),
      section(2, {
        instructors: [sisInstructor(1, "PI")],
        crosslist: crosslist(true),
      }),
    ]);

    expect(costs.get(2)?.total).toBe(4000);
    expect(costs.get(1)?.total).toBe(0);
    expect(costs.get(1)?.lines[0].basis).toEqual({
      kind: "chargedOnOtherSection",
      sectionId: 2,
    });
  });

  it("charges the lowest id when neither partner here is primary", () => {
    const costs = estimate([
      section(5, {
        instructors: [sisInstructor(1, "PI")],
        crosslist: crosslist(false),
      }),
      section(3, {
        instructors: [sisInstructor(1, "PI")],
        crosslist: crosslist(false),
      }),
    ]);

    expect(costs.get(3)?.total).toBe(4000);
    expect(costs.get(5)?.total).toBe(0);
  });

  it("charges a TA on both partners only once", () => {
    const costs = estimate([
      section(1, {
        courseCode: "ANTH-4001",
        instructors: [sisInstructor(1, "PI"), sisInstructor(10, "TA")],
        crosslist: crosslist(true),
      }),
      section(2, {
        courseCode: "ANTH-8001",
        instructors: [sisInstructor(1, "PI"), sisInstructor(10, "TA")],
        crosslist: crosslist(false),
      }),
    ]);

    expect(totalsOf([...costs.values()]).taCost).toBe(9000);
  });

  it("charges a section whose partner is not in this term's list", () => {
    const costs = estimate([
      section(1, {
        instructors: [sisInstructor(1, "PI")],
        crosslist: crosslist(false),
      }),
    ]);

    expect(costs.get(1)?.total).toBe(4000);
  });
});
