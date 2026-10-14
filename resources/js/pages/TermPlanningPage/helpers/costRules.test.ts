import { describe, expect, it } from "vitest";
import type { JobCodeRate } from "@/types";
import { jobCodeRate, rateOverrides } from "./costAssumptions.fixture";
import {
  costOfRate,
  instructorRateOf,
  isFreeComponent,
  jobCodeRateOf,
  pricingOf,
  taRateOf,
  unstaffedRateOf,
  type TermRates,
} from "./costRules";

const ratesOf = (...rates: JobCodeRate[]) =>
  new Map(rates.map((rate) => [rate.code, rate]));

const lecturer = jobCodeRate("9753", 10000, {
  title: "Lecturer",
  fringeRate: 0.385,
});
const specialist = jobCodeRate("9754", 8000, { title: "Teaching Specialist" });
const unstaffed = jobCodeRate("TBA", 10000, { instructorType: null });
const ta = jobCodeRate("9511", 5000, {
  instructorType: "teaching_assistant",
  fringeRate: 1,
});
const ratesByJobCode = ratesOf(lecturer, specialist, unstaffed, ta);

const termRatesOf = (extra: Partial<TermRates> = {}): TermRates => ({
  ratesByJobCode,
  overrides: rateOverrides(),
  ...extra,
});

const overridesOf = (
  entries: [string, { salary: number | null; fringeRate: number | null }][],
) => rateOverrides({ jobCodeRates: new Map(entries) });

describe("costOfRate", () => {
  it("is salary × (1 + fringe)", () => {
    expect(costOfRate({ salary: 10000, fringeRate: 0.385 })).toBeCloseTo(13850);
  });
});

describe("pricingOf", () => {
  it("prices a person with two job codes at the higher cost", () => {
    const pricing = pricingOf(
      ["9754", "9753"],
      ratesByJobCode,
      rateOverrides(),
    );

    expect(pricing.jobCode).toBe("9753");
  });

  it("compares cost including fringe", () => {
    const rates = ratesOf(
      jobCodeRate("A", 10000, { fringeRate: 0 }),
      jobCodeRate("B", 8000, { fringeRate: 0.5 }),
    );

    expect(pricingOf(["A", "B"], rates, rateOverrides()).jobCode).toBe("B");
  });

  it("picks the higher cost after the term's override", () => {
    const overrides = overridesOf([
      ["9754", { salary: 15000, fringeRate: null }],
    ]);

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
});

describe("jobCodeRateOf", () => {
  it("is Nova's salary and fringe when the term has no override", () => {
    expect(jobCodeRateOf("9753", termRatesOf())).toEqual({
      salary: 10000,
      fringeRate: 0.385,
    });
  });

  it("merges an override of one field over Nova's other field", () => {
    const termRates = termRatesOf({
      overrides: overridesOf([["9753", { salary: 11000, fringeRate: null }]]),
    });

    expect(jobCodeRateOf("9753", termRates)).toEqual({
      salary: 11000,
      fringeRate: 0.385,
    });
  });

  it("completes a code Nova has no rate for from the two overrides", () => {
    const termRates = termRatesOf({
      overrides: overridesOf([["9517", { salary: 7000, fringeRate: 0.4 }]]),
    });

    expect(jobCodeRateOf("9517", termRates)).toEqual({
      salary: 7000,
      fringeRate: 0.4,
    });
  });

  it("is null while either field is still missing", () => {
    const termRates = termRatesOf({
      overrides: overridesOf([["9517", { salary: 7000, fringeRate: null }]]),
    });

    expect(jobCodeRateOf("9517", termRates)).toBeNull();
    expect(jobCodeRateOf("9999", termRatesOf())).toBeNull();
  });
});

describe("instructorRateOf", () => {
  it("costs a lecturer at the rate for the job code", () => {
    const pricing = pricingOf(["9753"], ratesByJobCode, rateOverrides());

    expect(instructorRateOf(pricing, termRatesOf())).toEqual({
      salary: 10000,
      fringeRate: 0.385,
    });
  });

  it("costs a job code with no rate at the TBA rate", () => {
    const pricing = pricingOf(["9517"], ratesByJobCode, rateOverrides());

    expect(instructorRateOf(pricing, termRatesOf())).toEqual({
      salary: 10000,
      fringeRate: 0,
    });
  });

  it("costs a job code with no rate at the term's TBA rate", () => {
    const pricing = pricingOf(["9517"], ratesByJobCode, rateOverrides());
    const termRates = termRatesOf({
      overrides: overridesOf([["TBA", { salary: 12000, fringeRate: null }]]),
    });

    expect(instructorRateOf(pricing, termRates)?.salary).toBe(12000);
  });

  it("is null when neither the job code nor TBA has a rate", () => {
    const pricing = pricingOf(["9517"], ratesOf(lecturer), rateOverrides());
    const termRates = termRatesOf({ ratesByJobCode: ratesOf(lecturer) });

    expect(instructorRateOf(pricing, termRates)).toBeNull();
  });
});

describe("unstaffedRateOf", () => {
  it("is the TBA rate", () => {
    expect(unstaffedRateOf(termRatesOf())?.salary).toBe(10000);
  });
});

describe("taRateOf", () => {
  it("is the rate for the TA's job code", () => {
    const pricing = pricingOf(["9511"], ratesByJobCode, rateOverrides());

    expect(taRateOf(pricing, termRatesOf())).toEqual({
      salary: 5000,
      fringeRate: 1,
    });
  });

  it("does not fall back to TBA", () => {
    const pricing = pricingOf(["9517"], ratesByJobCode, rateOverrides());

    expect(taRateOf(pricing, termRatesOf())).toBeNull();
  });

  it("is null for a person with no job code", () => {
    const pricing = pricingOf([], ratesByJobCode, rateOverrides());

    expect(taRateOf(pricing, termRatesOf())).toBeNull();
  });
});

describe("isFreeComponent", () => {
  it("frees independent study and fieldwork", () => {
    expect(isFreeComponent("IND")).toBe(true);
    expect(isFreeComponent("FWK")).toBe(true);
    expect(isFreeComponent("LEC")).toBe(false);
  });
});
