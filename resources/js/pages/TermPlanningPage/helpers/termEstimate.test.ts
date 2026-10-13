import { describe, expect, it } from "vitest";
import type { CostLineOverride, CostPerson } from "@/types";
import type { PlannedSection } from "../types";
import {
  costAssumptions,
  costPerson,
  jobCodeRate,
  rateOverrides,
  sisInstructor,
  taAppointmentRate,
} from "./costAssumptions.fixture";
import { lineOverridesByKeyOf, type RateOverrides } from "./costOverrides";
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
    jobCodeRate("R", 0, { instructorType: "recurring_budget_faculty" }),
    jobCodeRate("TBA", 5000, { instructorType: null }),
  ],
  taRates: { fiscalYear: 2027, rates: [taAppointmentRate(9000)] },
  people,
});

const estimate = (
  sections: PlannedSection[],
  overrides: {
    rates?: RateOverrides;
    lines?: CostLineOverride[];
  } = {},
  withAssumptions = assumptions,
) =>
  estimateTermCost({
    sections,
    assumptions: withAssumptions,
    rateOverrides: overrides.rates ?? rateOverrides(),
    lineOverridesByKey: lineOverridesByKeyOf(overrides.lines ?? [], {}),
  });

const lineOverride = (
  section: string,
  emplid: number,
  amount: number,
): CostLineOverride => ({
  courseCode: "ANTH-1001",
  section,
  emplid,
  amount,
  reason: null,
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

  it("costs a section with no instructors at the TBA rate", () => {
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

  it("costs an IND section with a PI nothing", () => {
    const costs = estimate([
      section(1, { component: "IND", instructors: [sisInstructor(1, "PI")] }),
    ]);

    expect(costs.get(1)?.total).toBe(0);
    expect(costs.get(1)?.lines[0]).toMatchObject({
      role: "instructor",
      emplid: 1,
      amount: 0,
      basis: { kind: "freeComponent", component: "IND" },
    });
  });

  it("costs an FWK section with a PI nothing", () => {
    const costs = estimate([
      section(1, { component: "FWK", instructors: [sisInstructor(1, "PI")] }),
    ]);

    expect(costs.get(1)?.total).toBe(0);
  });

  it("gives a free IND section with no instructors a zero unstaffed line", () => {
    const costs = estimate([section(1, { component: "IND" })]);

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
    const costs = estimate([
      section(1, { section: "001", component: "IND", instructors: [ta] }),
      section(2, { section: "002", component: "LEC", instructors: [ta] }),
    ]);

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
      {},
      { ...assumptions, taRates: { fiscalYear: null, rates: [] } },
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

  it("prices a person absent from assumptions.people at the TBA rate", () => {
    const costs = estimate([
      section(1, { instructors: [sisInstructor(99, "PI")] }),
    ]);

    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 5000,
      basis: { kind: "unratedJobCode", jobCode: null },
    });
  });

  it("prices a TA with a line override at the override", () => {
    const costs = estimate(
      [section(1, { instructors: [sisInstructor(10, "TA")] })],
      { lines: [lineOverride("001", 10, 1000)] },
    );

    expect(costs.get(1)?.taCost).toBe(1000);
  });

  it("costs a recurring budget PI at their job code's $0 rate", () => {
    const costs = estimate([
      section(1, { instructors: [sisInstructor(3, "PI")] }),
    ]);

    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 0,
      basis: { kind: "jobCodeRate", jobCode: "R" },
    });
  });
});

describe("estimateTermCost with overrides", () => {
  const pi = (emplid: number) => sisInstructor(emplid, "PI");

  it("prices a PI at the term's rate over Nova's", () => {
    const costs = estimate([section(1, { instructors: [pi(1)] })], {
      rates: rateOverrides({
        costPerCourseByJobCode: new Map([["A", 4500]]),
      }),
    });

    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 4500,
      basis: { kind: "jobCodeRate", jobCode: "A", rateFiscalYear: null },
    });
  });

  it("costs an unstaffed section at the term's TBA rate", () => {
    const costs = estimate([section(1)], {
      rates: rateOverrides({
        costPerCourseByJobCode: new Map([["TBA", 6000]]),
      }),
    });

    expect(costs.get(1)?.instructorCost).toBe(6000);
  });

  it("prices a PI at a line override over the term's rate", () => {
    const costs = estimate([section(1, { instructors: [pi(1), pi(2)] })], {
      rates: rateOverrides({
        costPerCourseByJobCode: new Map([["A", 4500]]),
      }),
      lines: [lineOverride("001", 1, 3000)],
    });

    expect(costs.get(1)?.lines).toMatchObject([
      {
        emplid: 1,
        amount: 3000,
        basis: { kind: "lineOverride", reason: null, replacedAmount: 4500 },
      },
      { emplid: 2, amount: 6000 },
    ]);
  });

  it("applies a line override only to its own section", () => {
    const costs = estimate(
      [
        section(1, { instructors: [pi(1)] }),
        section(2, { courseCode: "ANTH-2001", instructors: [pi(1)] }),
      ],
      { lines: [lineOverride("001", 1, 3000)] },
    );

    expect(costs.get(1)?.total).toBe(3000);
    expect(costs.get(2)?.total).toBe(4000);
  });

  it("ignores a line override on a TA charged on another section", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate(
      [
        section(1, { section: "001", component: "LEC", instructors: [ta] }),
        section(2, { section: "002", component: "DIS", instructors: [ta] }),
      ],
      { lines: [lineOverride("002", 10, 1)] },
    );

    expect(costs.get(2)?.lines[0].basis.kind).toBe("chargedOnOtherSection");
    expect(costs.get(2)?.total).toBe(0);
  });

  it("costs a TA holding an ABD job code at the ABD rate", () => {
    const costs = estimate(
      [section(1, { instructors: [sisInstructor(12, "TA")] })],
      {},
      {
        ...assumptions,
        jobCodes: [
          ...assumptions.jobCodes,
          jobCodeRate("9519", null, {
            instructorType: "teaching_assistant",
            studentStatus: "abd",
          }),
        ],
        people: [...people, costPerson(12, ["9519"])],
        taRates: {
          fiscalYear: 2027,
          rates: [
            taAppointmentRate(9000),
            taAppointmentRate(6000, { studentStatus: "abd" }),
          ],
        },
      },
    );

    expect(costs.get(1)?.taCost).toBe(6000);
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
          basis: {
            kind: "paidOnLecture",
            component: "LAB",
            lectureSectionId: 1,
          },
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
      basis: { kind: "paidOnLecture", component: "DIS", lectureSectionId: 1 },
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
      lectureSectionId: 1,
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
        basis: { kind: "paidOnLecture", component: "LAB", lectureSectionId: 1 },
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
