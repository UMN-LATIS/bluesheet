import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costPerson,
  jobCodeRate,
  rateOverrides,
  taAppointmentRate,
} from "./costAssumptions.fixture";
import { taRateKeyOf } from "./costOverrides";
import { rateRowsOf } from "./rateRows";

const assumptions = costAssumptions({
  jobCodes: [
    jobCodeRate("9753", 10000, { title: "Lecturer", source: "FY27 sheet" }),
    jobCodeRate("9511", null, { instructorType: "teaching_assistant" }),
    jobCodeRate("9401", 0, {
      instructorType: "recurring_budget_faculty",
      rateFiscalYear: 2026,
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
  taRates: {
    fiscalYear: 2027,
    rates: [
      taAppointmentRate(26189, { appointmentPercent: 50 }),
      taAppointmentRate(13578),
      taAppointmentRate(9311, { studentStatus: "abd" }),
      taAppointmentRate(13451, { season: "spring" }),
    ],
  },
});

const rowsOf = (overrides = rateOverrides()) =>
  rateRowsOf(assumptions, overrides, new Set([1, 2, 3, 4]));

const rowOfCode = (code: string, overrides = rateOverrides()) =>
  rowsOf(overrides).find((row) => row.code === code);

describe("rateRowsOf", () => {
  it("lists this term's instructors' codes, then TBA, then the TA rates", () => {
    expect(rowsOf().map(({ code, title }) => `${code} ${title}`)).toEqual([
      "9401 Title 9401",
      "9511 Title 9511",
      "9517 Ph D Candidate Grad Instr",
      "9753 Lecturer",
      "TBA Unstaffed",
      "TA 25% appointment",
      "TA 25% appointment, ABD",
    ]);
  });

  it("shows Nova's rate and fund when the term has no override", () => {
    expect(rowOfCode("9753")).toMatchObject({
      fundLabel: "UI",
      amount: 10000,
      novaAmount: 10000,
      isOverriddenForTerm: false,
    });
  });

  it("titles a code Nova does not list from the appointment, with no rate", () => {
    expect(rowOfCode("9517")).toMatchObject({
      fundLabel: "—",
      amount: null,
      novaAmount: null,
    });
  });

  it("shows the term's override over Nova's rate", () => {
    const overrides = rateOverrides({
      costPerCourseByJobCode: new Map([["9753", 11000]]),
    });

    expect(rowOfCode("9753", overrides)).toMatchObject({
      amount: 11000,
      novaAmount: 10000,
      isOverriddenForTerm: true,
    });
  });

  it("shows the season's 25% TA rates, regular and ABD", () => {
    const [regular, abd] = rowsOf().filter(({ code }) => code === "TA");

    expect(regular).toMatchObject({ amount: 13578, fundLabel: "TA/GI" });
    expect(abd).toMatchObject({ amount: 9311 });
  });

  it("shows the term's override of a TA rate", () => {
    const overrides = rateOverrides({
      costPerTermByTaRateKey: new Map([[taRateKeyOf(25, "abd"), 9500]]),
    });
    const abd = rowsOf(overrides).at(-1);

    expect(abd).toMatchObject({
      amount: 9500,
      novaAmount: 9311,
      isOverriddenForTerm: true,
    });
  });
});
