import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costPerson,
  jobCodeRate,
  rateOverrides,
} from "./costAssumptions.fixture";
import { gradRateRowsOf, rateRowsOf } from "./rateRows";

const assumptions = costAssumptions({
  jobCodes: [
    jobCodeRate("9753", 10000, {
      title: "Lecturer",
      source: "FY27 sheet",
      fringeRate: 0.385,
    }),
    jobCodeRate("9511", 5870.2, {
      instructorType: "teaching_assistant",
      fringeRate: 1.1264,
    }),
    jobCodeRate("9401", 0, {
      instructorType: "recurring_budget_faculty",
      fringeRate: 0,
    }),
    jobCodeRate("TBA", 10000, { title: "Unstaffed", instructorType: null }),
  ],
  people: [
    costPerson(1, ["9753"]),
    costPerson(2, ["9511"]),
    costPerson(3, ["9517"], { "9517": "Ph D Candidate Grad Instr" }),
    costPerson(4, ["9401"]),
    costPerson(5, ["9999"]),
  ],
});

const rowsOf = (overrides = rateOverrides()) =>
  rateRowsOf(assumptions, overrides, new Set([1, 2, 3, 4]));

const rowOfCode = (code: string, overrides = rateOverrides()) =>
  rowsOf(overrides).find((row) => row.code === code);

describe("rateRowsOf", () => {
  it("lists the non-grad codes held by anyone charged this term, then TBA", () => {
    expect(rowsOf().map(({ code, title }) => `${code} ${title}`)).toEqual([
      "9401 Title 9401",
      "9517 Ph D Candidate Grad Instr",
      "9753 Lecturer",
      "TBA Unstaffed",
    ]);
  });

  it("shows the default salary, fringe, cost and fund when the term has no override", () => {
    const row = rowOfCode("9753");

    expect(row).toMatchObject({
      fundLabel: "UI",
      perLabel: "Section",
      salary: { amount: 10000, novaAmount: 10000, isOverridden: false },
      fringeRate: { amount: 0.385, novaAmount: 0.385, isOverridden: false },
    });
    expect(row?.cost).toBeCloseTo(13850);
  });

  it("marks a recurring budget code", () => {
    expect(rowOfCode("9401")?.isRecurring).toBe(true);
    expect(rowOfCode("9753")?.isRecurring).toBe(false);
  });

  it("titles a code the default rates do not list from the appointment, with no cost", () => {
    expect(rowOfCode("9517")).toMatchObject({
      fundLabel: "—",
      salary: { amount: null, novaAmount: null },
      cost: null,
    });
  });

  it("shows an override of one field over the default and leaves the other", () => {
    const overrides = rateOverrides({
      jobCodeRates: new Map([["9753", { salary: 11000, fringeRate: null }]]),
    });
    const row = rowOfCode("9753", overrides);

    expect(row).toMatchObject({
      salary: { amount: 11000, novaAmount: 10000, isOverridden: true },
      fringeRate: { amount: 0.385, isOverridden: false },
    });
    expect(row?.cost).toBeCloseTo(15235);
  });

  it("costs a code with no default rate once the term supplies both fields", () => {
    const overrides = rateOverrides({
      jobCodeRates: new Map([["9517", { salary: 6000, fringeRate: 0.5 }]]),
    });

    expect(rowOfCode("9517", overrides)?.cost).toBeCloseTo(9000);
  });
});

describe("gradRateRowsOf", () => {
  const gradAssumptions = costAssumptions({
    jobCodes: [
      jobCodeRate("9753", 10000, { fringeRate: 0.385 }),
      jobCodeRate("9519", 5870.2, {
        instructorType: "teaching_assistant",
        fringeRate: 0.4219,
      }),
      jobCodeRate("9515", 5870.2, {
        instructorType: "graduate_instructor",
        fringeRate: 1.1264,
      }),
    ],
    people: [costPerson(1, ["9753"])],
  });
  const gradRows = (overrides = rateOverrides()) =>
    gradRateRowsOf(gradAssumptions, overrides);

  it("lists every grad code, held by anyone or not, and no other code", () => {
    expect(gradRows().map(({ code }) => code)).toEqual(["9515", "9519"]);
  });

  it("counts a teaching assistant per course and a grad instructor per section", () => {
    expect(gradRows().map(({ perLabel }) => perLabel)).toEqual([
      "Section",
      "Course",
    ]);
  });

  it("prices a 25% appointment, then two and three times that", () => {
    const [, teachingAssistant] = gradRows();

    expect(teachingAssistant.cost).toBeCloseTo(8347, 0);
    expect(
      teachingAssistant.costByAppointmentPercent.map(({ percent, cost }) => [
        percent,
        Math.round((cost ?? 0) / (teachingAssistant.cost ?? 1)),
      ]),
    ).toEqual([
      [25, 1],
      [50, 2],
      [75, 3],
    ]);
  });

  it("has no cost at any appointment while a field is missing", () => {
    const overrides = rateOverrides();
    const noRate = costAssumptions({
      jobCodes: [
        jobCodeRate("9519", null, { instructorType: "teaching_assistant" }),
      ],
    });

    expect(
      gradRateRowsOf(noRate, overrides)[0].costByAppointmentPercent.map(
        ({ cost }) => cost,
      ),
    ).toEqual([null, null, null]);
  });
});
