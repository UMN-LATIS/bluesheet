import { describe, expect, it } from "vitest";
import {
  costAssumptions,
  costPerson,
  jobCodeRate,
  rateOverrides,
  taAppointmentRate,
} from "./costAssumptions.fixture";
import { taRateKeyOf } from "./costOverrides";
import { jobCodeRateRowsOf, taRateRowsOf } from "./rateRows";

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
  jobCodeRateRowsOf(assumptions, overrides, new Set([1, 2, 3, 4]), "Fall 2026");

describe("jobCodeRateRowsOf", () => {
  it("lists this term's instructors' codes, TA codes too, then TBA", () => {
    expect(rowsOf().map(({ code }) => code)).toEqual([
      "9401",
      "9511",
      "9517",
      "9753",
      "TBA",
    ]);
  });

  it("labels the TBA row as the unstaffed placeholder", () => {
    const unstaffedRow = rowsOf().find(({ code }) => code === "TBA");

    expect(unstaffedRow).toMatchObject({
      codeLabel: "—",
      title: "Unstaffed",
      instructorTypeLabel: "Unstaffed (placeholder)",
    });
    expect(rowsOf()[0]).toMatchObject({ codeLabel: "9401" });
  });

  it("shows Nova's rate and source when the term has no override", () => {
    const lecturer = rowsOf().find(({ code }) => code === "9753");

    expect(lecturer).toMatchObject({
      title: "Lecturer",
      fundLabel: "UI",
      amount: 10000,
      novaAmount: 10000,
      isOverriddenForTerm: false,
      source: "FY27 sheet",
    });
  });

  it("says when Nova's rate is from an earlier year", () => {
    const professor = rowsOf().find(({ code }) => code === "9401");

    expect(professor?.source).toBe("FY26 rate · FY27 not entered yet");
  });

  it("titles a code Nova does not list from the appointment", () => {
    const candidate = rowsOf().find(({ code }) => code === "9517");

    expect(candidate).toMatchObject({
      title: "Ph D Candidate Grad Instr",
      amount: null,
      source: "No rate in Nova · costs the Unstaffed rate",
    });
  });

  it("shows the term's override and what it replaced", () => {
    const overrides = rateOverrides({
      costPerCourseByJobCode: new Map([
        ["9753", 11000],
        ["9517", 7000],
      ]),
    });
    const rows = rowsOf(overrides);

    expect(rows.find(({ code }) => code === "9753")).toMatchObject({
      amount: 11000,
      isOverriddenForTerm: true,
      source: "Changed for Fall 2026 · was $10,000",
    });
    expect(rows.find(({ code }) => code === "9517")?.source).toBe(
      "Changed for Fall 2026 · no rate in Nova",
    );
  });
});

describe("taRateRowsOf", () => {
  it("has one row per percent for the term's season, with regular and ABD cells", () => {
    const rows = taRateRowsOf(assumptions, rateOverrides());

    expect(rows.map(({ appointmentPercent }) => appointmentPercent)).toEqual([
      25, 50,
    ]);
    expect(rows[0]).toMatchObject({
      hoursPerTerm: 196,
      cells: {
        regular: { amount: 13578, isOverriddenForTerm: false },
        abd: { amount: 9311 },
      },
    });
    expect(rows[1].cells.abd.amount).toBeNull();
  });

  it("shows the term's override in its cell", () => {
    const overrides = rateOverrides({
      costPerTermByTaRateKey: new Map([[taRateKeyOf(25, "abd"), 9500]]),
    });

    expect(taRateRowsOf(assumptions, overrides)[0].cells.abd).toMatchObject({
      amount: 9500,
      novaAmount: 9311,
      isOverriddenForTerm: true,
    });
  });
});
