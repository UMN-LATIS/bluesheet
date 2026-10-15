import { describe, expect, it } from "vitest";
import type { CostPerson, JobCodeRate } from "@/types";
import type { PlannedSection, SisSectionMeeting } from "../types";
import {
  costAssumptions,
  costPerson,
  FALL_GRAD_INPUTS,
  FALL_GRAD_LEVELS,
  gradJobCodeRate,
  gradRates,
  jobCodeRate,
  rateOverrides,
  ROUND_GRAD_INPUTS,
  roundGradRates,
  sisInstructor,
} from "./costAssumptions.fixture";
import type { RateOverrides } from "./costOverrides";
import { estimateTermCost, totalsOf } from "./termEstimate";
import { plannedSection } from "./plannedSection.fixture";

const section = (id: number, extra: Partial<PlannedSection> = {}) =>
  plannedSection(id, [], { section: String(id).padStart(3, "0"), ...extra });

const people: CostPerson[] = [
  costPerson(1, ["A"]),
  costPerson(2, ["B"]),
  costPerson(3, ["R"]),
  costPerson(10, ["TA"]),
  costPerson(11, ["TA"]),
];

const assumptions = costAssumptions({
  gradRates: roundGradRates(),
  jobCodes: [
    jobCodeRate("A", 4000),
    jobCodeRate("B", 6000),
    jobCodeRate("R", 0, { instructorType: "recurring_budget_faculty" }),
    gradJobCodeRate("TA", "teaching_assistant", "regular"),
    jobCodeRate("TBA", 5000, { instructorType: null }),
  ],
  people,
});

const withJobCodeRates = (...rates: JobCodeRate[]) =>
  costAssumptions({
    ...assumptions,
    jobCodes: [
      ...assumptions.jobCodes.filter(
        ({ code }) => !rates.some((rate) => rate.code === code),
      ),
      ...rates,
    ],
  });

const estimate = (
  sections: PlannedSection[],
  overrides: { rates?: RateOverrides } = {},
  withAssumptions = assumptions,
) =>
  estimateTermCost({
    sections,
    assumptions: withAssumptions,
    rateOverrides: overrides.rates ?? rateOverrides(),
  });

describe("estimateTermCost", () => {
  it("splits a PI's cost into salary and fringe", () => {
    const costs = estimate(
      [section(1, { instructors: [sisInstructor(1, "PI")] })],
      {},
      withJobCodeRates(jobCodeRate("A", 4000, { fringeRate: 0.25 })),
    );

    expect(costs.get(1)?.lines[0]).toMatchObject({
      salary: 4000,
      fringe: 1000,
      amount: 5000,
    });
  });

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
        salary: 5000,
        fringe: 0,
        amount: 5000,
        basis: { kind: "rate" },
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
      taCost: 4500,
      total: 4500,
    });
  });

  it("charges a TA once, on the lecture, across a lecture and two discussions", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { section: "001", component: "DIS", instructors: [ta] }),
      section(2, { section: "002", component: "DIS", instructors: [ta] }),
      section(3, { section: "010", component: "LEC", instructors: [ta] }),
    ]);

    expect(costs.get(3)?.lines[0]).toMatchObject({ amount: 4500 });
    expect(costs.get(3)?.lines[0].basis.kind).toBe("rate");
    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 0,
      basis: { kind: "paidOnLecture", lectureSectionId: 3 },
    });
    expect(costs.get(2)?.lines[0]).toMatchObject({
      amount: 0,
      basis: { kind: "paidOnLecture", lectureSectionId: 3 },
    });
    expect(totalsOf([...costs.values()]).taCost).toBe(4500);
  });

  it("splits a grad TA's appointment across their lectures, across courses", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { courseCode: "ANTH-1001", instructors: [ta] }),
      section(2, { courseCode: "ANTH-2001", instructors: [ta] }),
    ]);

    for (const id of [1, 2]) {
      expect(costs.get(id)?.lines[0]).toMatchObject({
        amount: 4500,
        basis: { kind: "rate" },
        gradAppointment: { cost: { total: 9000 } },
      });
    }
    expect(totalsOf([...costs.values()]).taCost).toBe(9000);
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
    expect(costs.get(2)?.taCost).toBe(4500);
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
      basis: { kind: "freeComponent" },
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
        salary: 0,
        fringe: 0,
        amount: 0,
        basis: { kind: "freeComponent" },
      },
    ]);
  });

  it("charges a TA on the LEC when they also appear on a free IND section of the course", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { section: "001", component: "IND", instructors: [ta] }),
      section(2, { section: "002", component: "LEC", instructors: [ta] }),
    ]);

    expect(costs.get(2)?.taCost).toBe(4500);
    expect(costs.get(1)?.lines[0].basis.kind).toBe("freeComponent");
    expect(costs.get(1)?.total).toBe(0);
  });

  it("leaves the amount null and out of the totals when the term has no grad inputs", () => {
    const costs = estimate(
      [
        section(1, {
          instructors: [sisInstructor(1, "PI"), sisInstructor(10, "TA")],
        }),
      ],
      {},
      { ...assumptions, gradRates: gradRates({ defaults: null }) },
    );

    const taLine = costs.get(1)?.lines[1];
    expect(taLine).toMatchObject({ role: "ta", amount: null });
    expect(taLine?.basis.kind).toBe("rate");

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
      basis: { kind: "rate" },
    });
  });

  it("costs a recurring budget PI at their job code's $0 rate", () => {
    const costs = estimate([
      section(1, { instructors: [sisInstructor(3, "PI")] }),
    ]);

    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 0,
      basis: { kind: "rate" },
    });
  });
});

describe("estimateTermCost with overrides", () => {
  const pi = (emplid: number) => sisInstructor(emplid, "PI");

  it("prices a person's every paid section at their own salary over the job code's", () => {
    const costs = estimate(
      [
        section(1, { instructors: [pi(1)] }),
        section(2, { courseCode: "ANTH-2001", instructors: [pi(1)] }),
      ],
      {
        rates: rateOverrides({
          salaryByEmplid: new Map([[1, 7000]]),
        }),
      },
    );

    expect(totalsOf([...costs.values()]).instructorCost).toBe(14000);
  });

  it("adds the job code's fringe on top of a person's salary override", () => {
    const costs = estimate(
      [section(1, { instructors: [pi(1)] })],
      { rates: rateOverrides({ salaryByEmplid: new Map([[1, 7000]]) }) },
      withJobCodeRates(jobCodeRate("A", 4000, { fringeRate: 0.5 })),
    );

    expect(costs.get(1)?.lines[0]).toMatchObject({
      salary: 7000,
      fringe: 3500,
      amount: 10500,
    });
  });

  it("charges a person's salary override with no fringe when they have no rate", () => {
    const costs = estimate(
      [section(1, { instructors: [pi(99)] })],
      { rates: rateOverrides({ salaryByEmplid: new Map([[99, 7000]]) }) },
      withJobCodeRates(
        jobCodeRate("TBA", 5000, { instructorType: null, fringeRate: 0.5 }),
      ),
    );

    expect(costs.get(1)?.lines[0]).toMatchObject({
      salary: 7000,
      fringe: 3500,
    });
  });

  it("ignores a person's salary override on a TA", () => {
    const costs = estimate(
      [section(1, { instructors: [sisInstructor(10, "TA")] })],
      {
        rates: rateOverrides({ salaryByEmplid: new Map([[10, 4000]]) }),
      },
    );

    expect(costs.get(1)?.taCost).toBe(4500);
  });

  it("leaves a lab paid on its lecture at nothing despite the person's rate", () => {
    const costs = estimate(
      [
        section(1, { section: "001", component: "LEC", instructors: [pi(1)] }),
        section(2, { section: "002", component: "LAB", instructors: [pi(1)] }),
      ],
      {
        rates: rateOverrides({ salaryByEmplid: new Map([[1, 7000]]) }),
      },
    );

    expect(costs.get(2)?.lines[0].amount).toBe(0);
  });

  it("costs a TA holding a grad job code from the Grad Student Calculator", () => {
    const fallAssumptions = {
      ...assumptions,
      gradRates: gradRates({
        defaults: FALL_GRAD_INPUTS,
        levels: FALL_GRAD_LEVELS,
      }),
      jobCodes: [
        ...assumptions.jobCodes,
        gradJobCodeRate("9511", "teaching_assistant", "regular"),
        gradJobCodeRate("9519", "teaching_assistant", "abd"),
      ],
      people: [...people, costPerson(12, ["9511"]), costPerson(13, ["9519"])],
    };
    const costs = estimate(
      [
        section(1, {
          instructors: [sisInstructor(12, "TA"), sisInstructor(13, "TA")],
        }),
      ],
      {},
      fallAssumptions,
    );
    const [regular, abd] = costs.get(1)?.lines ?? [];

    expect(regular.amount).toBeCloseTo(6241.18, 2);
    expect(regular.salary).toBeCloseTo(2935.1, 2);
    expect(regular.fringe).toBeCloseTo(848.24 + 2457.84, 2);
    expect(abd.amount).toBeCloseTo(4173.38, 2);
  });

  it("costs a TA at the admin's hours and offsets for a person with a fee offset", () => {
    const costs = estimate(
      [section(1, { instructors: [sisInstructor(10, "TA")] })],
      {
        rates: rateOverrides({
          gradPeopleByEmplid: new Map([
            [10, { emplid: 10, hasFeeOffset: true, isInternational: false }],
          ]),
        }),
      },
      costAssumptions({
        ...assumptions,
        gradRates: {
          ...roundGradRates(),
          defaults: { ...ROUND_GRAD_INPUTS, feeOffset: 200 },
          levels: [{ appointmentPercent: 12.5, hours: 1000 }],
        },
      }),
    );

    expect(costs.get(1)?.lines[0]).toMatchObject({
      salary: 10_050,
      amount: 10_050,
      gradAppointment: { cost: { hours: 1000, feeOffset: 50 } },
    });
  });

  it("costs a grad instructor with no appointment of their own at the admin's default", () => {
    const costs = estimate(
      [section(1, { instructors: [sisInstructor(10, "PI")] })],
      {},
      costAssumptions({
        ...assumptions,
        gradRates: { ...roundGradRates(), defaultAppointmentPercent: 50 },
      }),
    );

    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 18_000,
      gradAppointment: { student: { appointmentPercent: 50 } },
    });
  });

  it("costs an appointment between levels in proportion to the nearest level's hours", () => {
    const costs = estimate([
      section(1, {
        instructors: [{ ...sisInstructor(10, "TA"), appointmentPercent: 37.5 }],
      }),
    ]);

    expect(costs.get(1)?.lines[0]).toMatchObject({
      role: "ta",
      amount: 13_500,
      gradAppointment: { cost: { hours: 1350 } },
    });
  });

  it("pays a grad instructor per credit across their paid sections, on the sum of their appointments, and charges once", () => {
    const gradInstructorAssumptions = {
      ...assumptions,
      jobCodes: [
        ...assumptions.jobCodes,
        gradJobCodeRate("9517", "graduate_instructor", "abd"),
      ],
      people: [...people, costPerson(14, ["9517"])],
    };
    const instructor = sisInstructor(14, "PI");
    const costs = estimate(
      [
        section(1, {
          courseCode: "ANTH-1001",
          credits: 3,
          instructors: [instructor],
        }),
        section(2, {
          courseCode: "ANTH-2001",
          credits: null,
          instructors: [instructor],
        }),
        section(3, {
          courseCode: "ANTH-3001",
          credits: 4,
          instructors: [instructor],
        }),
      ],
      {},
      gradInstructorAssumptions,
    );

    expect(costs.get(1)?.lines[0]).toMatchObject({
      role: "instructor",
      gradAppointment: {
        student: { creditsTaught: 7, isAbd: true },
        cost: { pay: 27_000 + 7 * 100 },
      },
    });
    for (const id of [1, 2, 3]) {
      expect(costs.get(id)?.instructorCost).toBeCloseTo(27_700 / 3, 6);
    }
  });

  it("does not count a lab paid on its lecture toward a grad instructor's credits", () => {
    const gradInstructorAssumptions = {
      ...assumptions,
      jobCodes: [
        ...assumptions.jobCodes,
        gradJobCodeRate("9517", "graduate_instructor", "abd"),
      ],
      people: [...people, costPerson(14, ["9517"])],
    };
    const instructor = sisInstructor(14, "PI");
    const costs = estimate(
      [
        section(1, {
          section: "001",
          component: "LEC",
          credits: 3,
          instructors: [instructor],
        }),
        section(2, {
          section: "002",
          component: "LAB",
          credits: 1,
          instructors: [instructor],
        }),
      ],
      {},
      gradInstructorAssumptions,
    );

    expect(costs.get(1)?.lines[0].gradAppointment?.student.creditsTaught).toBe(
      3,
    );
    expect(costs.get(2)?.lines[0].basis.kind).toBe("paidOnLecture");
  });

  it("charges a grad student once even when they teach and assist", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { section: "001", component: "DIS", instructors: [ta] }),
      section(2, { section: "002", component: "LEC", instructors: [ta] }),
    ]);

    expect(totalsOf([...costs.values()]).taCost).toBe(4500);
    expect(costs.get(2)?.lines[0].gradAppointment).toBeDefined();
    expect(costs.get(1)?.lines[0].gradAppointment).toBeUndefined();
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
          salary: 0,
          fringe: 0,
          amount: 0,
          basis: {
            kind: "paidOnLecture",
            lectureSectionId: 1,
          },
        },
      ]);
      expect(costs.get(id)?.total).toBe(0);
    }
    expect(totalsOf([...costs.values()]).total).toBe(4000);
  });

  it("charges a PI who is not on the lecture at their own rate", () => {
    const costs = estimate([
      section(1, { section: "001", component: "LEC", instructors: [pi(1)] }),
      section(2, { section: "002", component: "DIS", instructors: [pi(2)] }),
    ]);

    expect(costs.get(2)?.lines[0]).toMatchObject({
      emplid: 2,
      amount: 6000,
      basis: { kind: "rate" },
    });
  });

  it("pays a TA on the lecture once, there, when they lead a lab", () => {
    const costs = estimate([
      section(1, {
        section: "001",
        component: "LEC",
        instructors: [pi(1), sisInstructor(2, "TA")],
      }),
      section(2, { section: "002", component: "LAB", instructors: [pi(2)] }),
    ]);

    expect(costs.get(2)?.lines[0]).toMatchObject({
      emplid: 2,
      amount: 0,
      basis: { kind: "paidOnLecture", lectureSectionId: 1 },
    });
    expect(totalsOf([...costs.values()]).total).toBe(4000 + 6000);
  });

  it("charges a grad student 12.5% for each discussion they lead", () => {
    const costs = estimate([
      section(1, { section: "001", component: "LEC", instructors: [pi(1)] }),
      section(2, { section: "002", component: "DIS", instructors: [pi(10)] }),
      section(3, { section: "003", component: "DIS", instructors: [pi(10)] }),
    ]);

    for (const id of [2, 3]) {
      expect(costs.get(id)?.lines[0]).toMatchObject({
        emplid: 10,
        amount: 4500,
        sectionAppointment: {
          percent: 12.5,
          percentWithoutOverride: 12.5,
          isOverridden: false,
        },
        gradAppointment: { student: { appointmentPercent: 25 } },
      });
    }
  });

  it("splits the cost across a grad student's sections in proportion to each section's percent", () => {
    const otherCourse = (id: number, component: string) =>
      section(id, {
        courseCode: "ANTH-2001",
        section: String(id).padStart(3, "0"),
        component,
        instructors: [pi(10)],
      });
    const costs = estimate([
      section(1, { section: "001", component: "LEC", instructors: [pi(10)] }),
      otherCourse(2, "LAB"),
      otherCourse(3, "LAB"),
    ]);

    expect(costs.get(1)?.lines[0].gradAppointment).toMatchObject({
      student: { appointmentPercent: 50 },
      cost: { total: 18_000 },
    });
    expect(costs.get(1)?.total).toBe(9000);
    expect(costs.get(2)?.total).toBe(4500);
    expect(costs.get(3)?.total).toBe(4500);
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
    expect(costs.get(2)?.lines[0].basis.kind).toBe("rate");
  });

  it("counts only a grad TA's lecture when they also lead its discussions", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, {
        section: "001",
        component: "LEC",
        instructors: [pi(1), ta],
      }),
      section(2, { section: "002", component: "DIS", instructors: [pi(10)] }),
      section(3, { section: "003", component: "DIS", instructors: [pi(10)] }),
    ]);

    expect(costs.get(1)?.taCost).toBe(4500);
    expect(totalsOf([...costs.values()]).total).toBe(4000 + 4500);
  });

  it("uses an assignment's own appointment percent over the role's default", () => {
    const costs = estimate([
      section(1, {
        instructors: [{ ...pi(10), appointmentPercent: 50 }],
      }),
    ]);

    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 18_000,
      sectionAppointment: {
        percent: 50,
        percentWithoutOverride: 25,
        isOverridden: true,
      },
      gradAppointment: { student: { appointmentPercent: 50 } },
    });
  });

  it("uses the role's default for an assignment with a null appointment percent", () => {
    const costs = estimate([
      section(1, {
        instructors: [{ ...pi(10), appointmentPercent: null }],
      }),
    ]);

    expect(costs.get(1)?.lines[0]).toMatchObject({
      amount: 9000,
      sectionAppointment: {
        percent: 25,
        percentWithoutOverride: 25,
        isOverridden: false,
      },
    });
  });

  it("adds a grad student's appointments across sections with no cap", () => {
    const lecture = (id: number, courseCode: string) =>
      section(id, { courseCode, instructors: [pi(10)] });
    const costs = estimate([
      lecture(1, "ANTH-1001"),
      lecture(2, "ANTH-2001"),
      lecture(3, "ANTH-3001"),
    ]);

    expect(costs.get(1)?.lines[0].gradAppointment).toMatchObject({
      student: { appointmentPercent: 75 },
      cost: { hours: 2700, total: 27_000 },
    });
    for (const id of [1, 2, 3]) {
      expect(costs.get(id)?.total).toBe(9000);
    }
  });

  it("splits a grad student's cost by each section's own percent", () => {
    const costs = estimate([
      section(1, {
        courseCode: "ANTH-1001",
        instructors: [{ ...pi(10), appointmentPercent: 37.5 }],
      }),
      section(2, {
        courseCode: "ANTH-2001",
        instructors: [{ ...pi(10), appointmentPercent: 12.5 }],
      }),
    ]);

    expect(costs.get(1)?.total).toBe(13_500);
    expect(costs.get(2)?.total).toBe(4500);
  });

  it("charges an unstaffed lab in a lecture course at the TBA rate", () => {
    const costs = estimate([
      section(1, { section: "001", component: "LEC", instructors: [pi(1)] }),
      section(2, { section: "002", component: "LAB" }),
    ]);

    expect(costs.get(2)?.lines[0]).toMatchObject({
      role: "unstaffedSection",
      amount: 5000,
      basis: { kind: "rate" },
    });
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
      taCost: 4500,
      total: 14500,
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
      reason: "crosslisted",
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

  it("charges a grad TA on both partners only once", () => {
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

    expect(totalsOf([...costs.values()]).taCost).toBe(4500);
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

describe("estimateTermCost with sections at the same meeting time", () => {
  const monWed10: SisSectionMeeting[] = [
    { days: ["mon", "wed"], startTime: "10:10", endTime: "11:00" },
  ];
  const pi = (emplid: number) => sisInstructor(emplid, "PI");
  const honorsTwin = (extra: Partial<PlannedSection>) =>
    section(2, { courseCode: "ANTH-1001H", section: "001", ...extra });

  it("pays a PI once across an honors twin that is not crosslisted", () => {
    const costs = estimate([
      section(1, { section: "001", meetings: monWed10, instructors: [pi(1)] }),
      honorsTwin({ meetings: monWed10, instructors: [pi(1)] }),
    ]);

    expect(costs.get(1)?.total).toBe(4000);
    expect(costs.get(2)?.lines).toEqual([
      {
        role: "instructor",
        emplid: 1,
        salary: 0,
        fringe: 0,
        amount: 0,
        basis: {
          kind: "chargedOnOtherSection",
          sectionId: 1,
          reason: "sameMeetingTime",
        },
      },
    ]);
  });

  it("pays both sections when their meeting times differ", () => {
    const costs = estimate([
      section(1, { section: "001", meetings: monWed10, instructors: [pi(1)] }),
      honorsTwin({
        meetings: [{ ...monWed10[0], startTime: "11:15", endTime: "12:05" }],
        instructors: [pi(1)],
      }),
    ]);

    expect(costs.get(2)?.total).toBe(4000);
  });

  it("still pays a co-teacher who is only on the second section", () => {
    const costs = estimate([
      section(1, { section: "001", meetings: monWed10, instructors: [pi(1)] }),
      honorsTwin({ meetings: monWed10, instructors: [pi(1), pi(2)] }),
    ]);

    expect(
      costs.get(2)?.lines.map(({ emplid, amount }) => [emplid, amount]),
    ).toEqual([
      [1, 0],
      [2, 6000],
    ]);
  });

  it("charges a TA once across two courses at the same time", () => {
    const ta = sisInstructor(10, "TA");
    const costs = estimate([
      section(1, { section: "001", meetings: monWed10, instructors: [ta] }),
      honorsTwin({ meetings: monWed10, instructors: [ta] }),
    ]);

    expect(costs.get(1)?.taCost).toBe(4500);
    expect(costs.get(2)?.lines[0].basis).toEqual({
      kind: "chargedOnOtherSection",
      sectionId: 1,
      reason: "sameMeetingTime",
    });
  });

  it("pays on the lecture when the other section is a lab", () => {
    const costs = estimate([
      section(1, {
        courseCode: "ANTH-1000",
        component: "LAB",
        meetings: monWed10,
        instructors: [pi(1)],
      }),
      section(2, {
        courseCode: "ANTH-2000",
        component: "LEC",
        meetings: monWed10,
        instructors: [pi(1)],
      }),
    ]);

    expect(costs.get(2)?.total).toBe(4000);
    expect(costs.get(1)?.total).toBe(0);
  });
});
