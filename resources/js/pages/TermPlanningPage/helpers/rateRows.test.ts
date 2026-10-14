import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costPerson,
  FALL_GRAD_INPUTS,
  gradJobCodeRate,
  gradRates,
  jobCodeRate,
  rateOverrides,
} from "./costAssumptions.fixture";
import { gradRatesViewOf, rateRowsOf } from "./rateRows";

const assumptions = costAssumptions({
  jobCodes: [
    jobCodeRate("9753", 10000, {
      title: "Lecturer",
      source: "FY27 sheet",
      fringeRate: 0.385,
    }),
    gradJobCodeRate("9511", "teaching_assistant", "regular"),
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

describe("gradRatesViewOf", () => {
  const gradAssumptions = costAssumptions({
    jobCodes: [
      gradJobCodeRate("9519", "teaching_assistant", "abd"),
      gradJobCodeRate("9515", "graduate_instructor", "regular"),
      gradJobCodeRate("9517", "graduate_instructor", "abd"),
    ],
    gradRates: gradRates(),
  });
  const view = (overrides = rateOverrides()) =>
    gradRatesViewOf(gradAssumptions, overrides);

  it("lists the seven inputs with the admin's values", () => {
    expect(
      view().inputs.map(({ field, cell }) => [field, cell.amount]),
    ).toEqual(Object.entries(FALL_GRAD_INPUTS));
  });

  it("names the grad instructor codes in the per-credit hint", () => {
    const perCredit = view().inputs.find(
      ({ field }) => field === "perCreditPayment",
    );

    expect(perCredit?.hint).toBe("Per credit taught, 9515 and 9517");
  });

  it("marks an overridden input and keeps the admin's value to reset to", () => {
    const hourlyRate = view(rateOverrides({ gradInputs: { hourlyRate: 31 } }))
      .inputs[0];

    expect(hourlyRate.cell).toEqual({
      amount: 31,
      novaAmount: 29.95,
      isOverridden: true,
    });
  });

  it("prices each level for a regular and an ABD student", () => {
    const [, twentyFive] = view().appointments;

    expect(twentyFive).toMatchObject({ appointmentPercent: 25 });
    expect(twentyFive.salary).toBeCloseTo(5870.2, 2);
    expect(twentyFive.health).toBeCloseTo(1696.49, 2);
    expect(twentyFive.regularTuition).toBeCloseTo(4915.68, 2);
    expect(twentyFive.regularCost).toBeCloseTo(12482.37, 2);
    expect(twentyFive.abdTuition).toBeCloseTo(780.08, 2);
    expect(twentyFive.abdCost).toBeCloseTo(8346.77, 2);
  });

  it("uses the department's hours and marks them", () => {
    const [, twentyFive] = view(
      rateOverrides({ gradHoursByPercent: new Map([[25, 200]]) }),
    ).appointments;

    expect(twentyFive.hours).toEqual({
      amount: 200,
      novaAmount: 196,
      isOverridden: true,
    });
    expect(twentyFive.salary).toBeCloseTo(5990, 2);
  });

  it("has hours but no costs while an input is missing", () => {
    const missing = costAssumptions({
      gradRates: gradRates({ defaults: null }),
    });
    const [first] = gradRatesViewOf(missing, rateOverrides()).appointments;

    expect(first.hours.amount).toBe(98);
    expect(first.regularCost).toBeNull();
    expect(first.abdCost).toBeNull();
  });
});
