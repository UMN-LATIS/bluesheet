import { describe, expect, it } from "vitest";
import type { JobCodeRate } from "@/types";
import {
  jobCodeRate,
  rateOverrides,
  taAppointmentRate,
} from "./costAssumptions.fixture";
import { taRateKeyOf } from "./costOverrides";
import {
  costOfLeadInstructor,
  costOfTaAppointment,
  costOfUnstaffedSection,
  isFreeComponent,
  pricingOf,
  type TermRates,
} from "./costRules";

const ratesOf = (...rates: JobCodeRate[]) =>
  new Map(rates.map((rate) => [rate.code, rate]));

const lecturer = jobCodeRate("9753", 10000, { title: "Lecturer" });
const specialist = jobCodeRate("9754", 8000, { title: "Teaching Specialist" });
const unstaffed = jobCodeRate("TBA", 10000, { instructorType: null });
const ratesByJobCode = ratesOf(lecturer, specialist, unstaffed);

const termRatesOf = (extra: Partial<TermRates> = {}): TermRates => ({
  ratesByJobCode,
  overrides: rateOverrides(),
  season: "fall",
  taRates: [
    taAppointmentRate(13578),
    taAppointmentRate(9311, { studentStatus: "abd" }),
  ],
  taRateFiscalYear: 2027,
  ...extra,
});

const jobCodeOverridesOf = (costPerCourseByJobCode: [string, number][]) =>
  rateOverrides({ costPerCourseByJobCode: new Map(costPerCourseByJobCode) });

describe("pricingOf", () => {
  it("prices a person with two job codes at the higher rate", () => {
    const pricing = pricingOf(
      ["9754", "9753"],
      ratesByJobCode,
      rateOverrides(),
    );

    expect(pricing).toMatchObject({ jobCode: "9753", jobCodeCount: 2 });
  });

  it("picks the higher rate after the term's override", () => {
    const overrides = rateOverrides({
      costPerCourseByJobCode: new Map([["9754", 15000]]),
    });

    expect(pricingOf(["9753", "9754"], ratesByJobCode, overrides).jobCode).toBe(
      "9754",
    );
  });

  it("prefers a rated job code over an unrated one", () => {
    expect(
      pricingOf(["9517", "9754"], ratesByJobCode, rateOverrides()).jobCode,
    ).toBe("9754");
  });

  it("has no job code for a person with none in the department", () => {
    expect(pricingOf([], ratesByJobCode, rateOverrides())).toMatchObject({
      jobCode: null,
      rate: null,
    });
  });

  it("is ABD when any job code held is marked ABD", () => {
    const rates = ratesOf(
      jobCodeRate("9511", null),
      jobCodeRate("9519", null, { studentStatus: "abd" }),
    );

    expect(pricingOf(["9511"], rates, rateOverrides()).studentStatus).toBe(
      "regular",
    );
    expect(
      pricingOf(["9511", "9519"], rates, rateOverrides()).studentStatus,
    ).toBe("abd");
  });
});

describe("costOfLeadInstructor", () => {
  it("costs a lecturer at Nova's rate for the job code", () => {
    const pricing = pricingOf(["9753"], ratesByJobCode, rateOverrides());

    expect(costOfLeadInstructor(pricing, termRatesOf())).toEqual({
      amount: 10000,
      basis: {
        kind: "jobCodeRate",
        jobCode: "9753",
        title: "Lecturer",
        rateFiscalYear: 2027,
        jobCodeCount: 1,
      },
    });
  });

  it("costs a lecturer at the term's rate when the planner changed it", () => {
    const pricing = pricingOf(["9753"], ratesByJobCode, rateOverrides());
    const termRates = termRatesOf({
      overrides: jobCodeOverridesOf([["9753", 11000]]),
    });

    expect(costOfLeadInstructor(pricing, termRates)).toMatchObject({
      amount: 11000,
      basis: { kind: "jobCodeRate", rateFiscalYear: null },
    });
  });

  it("costs a job code with no rate at the TBA rate", () => {
    const pricing = pricingOf(["9517"], ratesByJobCode, rateOverrides());

    expect(costOfLeadInstructor(pricing, termRatesOf())).toEqual({
      amount: 10000,
      basis: { kind: "unratedJobCode", jobCode: "9517" },
    });
  });

  it("costs an unrated job code at the term's rate for it", () => {
    const pricing = pricingOf(["9517"], ratesByJobCode, rateOverrides());
    const termRates = termRatesOf({
      overrides: jobCodeOverridesOf([["9517", 7000]]),
    });

    expect(costOfLeadInstructor(pricing, termRates)).toMatchObject({
      amount: 7000,
      basis: { kind: "jobCodeRate", jobCode: "9517", title: null },
    });
  });

  it("costs a job code with no rate at the term's TBA rate", () => {
    const pricing = pricingOf(["9517"], ratesByJobCode, rateOverrides());
    const termRates = termRatesOf({
      overrides: jobCodeOverridesOf([["TBA", 12000]]),
    });

    expect(costOfLeadInstructor(pricing, termRates).amount).toBe(12000);
  });

  it("leaves the amount null when neither the job code nor TBA has a rate", () => {
    const pricing = pricingOf(["9517"], ratesOf(lecturer), rateOverrides());
    const termRates = termRatesOf({ ratesByJobCode: ratesOf(lecturer) });

    expect(costOfLeadInstructor(pricing, termRates).amount).toBeNull();
  });
});

describe("costOfUnstaffedSection", () => {
  it("costs the TBA rate", () => {
    expect(costOfUnstaffedSection(termRatesOf())).toEqual({
      amount: 10000,
      basis: { kind: "unstaffedSection" },
    });
  });
});

describe("costOfTaAppointment", () => {
  const regularTa = pricingOf([], ratesByJobCode, rateOverrides());

  it("costs a regular TA at the 25% rate for the season", () => {
    expect(costOfTaAppointment(regularTa, termRatesOf())).toEqual({
      amount: 13578,
      basis: {
        kind: "taAppointment",
        appointmentPercent: 25,
        season: "fall",
        studentStatus: "regular",
        rateFiscalYear: 2027,
      },
    });
  });

  it("costs an ABD TA at the ABD rate", () => {
    const abdTa = { ...regularTa, studentStatus: "abd" as const };

    expect(costOfTaAppointment(abdTa, termRatesOf()).amount).toBe(9311);
  });

  it("costs a TA at the term's rate when the planner changed it", () => {
    const termRates = termRatesOf({
      overrides: rateOverrides({
        costPerTermByTaRateKey: new Map([[taRateKeyOf(25, "regular"), 14000]]),
      }),
    });

    expect(costOfTaAppointment(regularTa, termRates)).toMatchObject({
      amount: 14000,
      basis: { kind: "taAppointment", rateFiscalYear: null },
    });
  });

  it("leaves the amount null when no rate exists for the season", () => {
    const termRates = termRatesOf({ season: "spring" });

    expect(costOfTaAppointment(regularTa, termRates)).toMatchObject({
      amount: null,
      basis: { kind: "noTaRate", season: "spring" },
    });
  });
});

describe("isFreeComponent", () => {
  it("frees independent study and fieldwork", () => {
    expect(isFreeComponent("IND")).toBe(true);
    expect(isFreeComponent("FWK")).toBe(true);
    expect(isFreeComponent("LEC")).toBe(false);
  });
});
