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
import { gradRatesOf, rateRowsOf } from "./rateRows";

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

describe("gradRatesOf", () => {
  const gradAssumptions = costAssumptions({
    jobCodes: [
      gradJobCodeRate("9519", "teaching_assistant", "abd"),
      gradJobCodeRate("9511", "teaching_assistant", "regular"),
      gradJobCodeRate("9515", "graduate_instructor", "regular"),
      jobCodeRate("9753", 10000),
    ],
    gradRates: gradRates(),
  });
  const ratesOf = (overrides = rateOverrides()) =>
    gradRatesOf(gradAssumptions, overrides);

  it("lists the seven inputs with the admin's values", () => {
    expect(
      ratesOf().inputs.map(({ field, cell }) => [field, cell.amount]),
    ).toEqual(Object.entries(FALL_GRAD_INPUTS));
  });

  it("marks an overridden input and keeps the admin's value to reset to", () => {
    const [hourlyRate] = ratesOf(
      rateOverrides({ gradInputs: { hourlyRate: 31 } }),
    ).inputs;

    expect(hourlyRate.cell).toEqual({
      amount: 31,
      novaAmount: 29.95,
      isOverridden: true,
    });
  });

  it("uses the department's hours and marks them", () => {
    const twentyFive = ratesOf(
      rateOverrides({ gradHoursByPercent: new Map([[25, 200]]) }),
    ).hours.find(({ appointmentPercent }) => appointmentPercent === 25);

    expect(twentyFive?.hours).toEqual({
      amount: 200,
      novaAmount: 196,
      isOverridden: true,
    });
  });

  it("costs each grad code, in code order, at 12.5% for a TA and the standard 25% for a grad instructor", () => {
    const { rows, defaultAppointmentPercent } = ratesOf();
    const rowOf = (code: string) => rows.find((row) => row.code === code);

    expect(defaultAppointmentPercent).toBe(25);
    expect(rows.map(({ code }) => code)).toEqual(["9511", "9515", "9519"]);
    expect(rows.map(({ appointmentPercent }) => appointmentPercent)).toEqual([
      12.5, 25, 12.5,
    ]);
    expect(rowOf("9511")?.cost?.total).toBeCloseTo(6241.18, 2);
    expect(rowOf("9515")?.cost?.total).toBeCloseTo(12482.37, 2);
    expect(rowOf("9519")?.cost?.total).toBeCloseTo(4173.38, 2);
  });

  it("costs a grad instructor code at the department's default appointment and leaves a TA code at 12.5%", () => {
    const rates = ratesOf(rateOverrides({ defaultAppointmentPercent: 50 }));
    const hoursOf = (code: string) =>
      rates.rows.find((row) => row.code === code)?.cost?.hours;

    expect(rates.isDefaultAppointmentOverridden).toBe(true);
    expect(hoursOf("9515")).toBe(392);
    expect(hoursOf("9511")).toBe(98);
  });

  it("has no costs while an input is missing", () => {
    const missing = costAssumptions({
      jobCodes: [gradJobCodeRate("9511", "teaching_assistant", "regular")],
      gradRates: gradRates({ defaults: null }),
    });

    expect(gradRatesOf(missing, rateOverrides()).rows[0].cost).toBeNull();
  });
});
