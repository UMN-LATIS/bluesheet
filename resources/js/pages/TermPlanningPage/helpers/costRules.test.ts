import { describe, expect, it } from "vitest";
import type { JobCodeRate } from "@/types";
import { gradJobCodeRate, jobCodeRate } from "./costAssumptions.fixture";
import {
  costOfRate,
  instructorRateOf,
  isFreeComponent,
  isGradJobCodeRate,
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
  ...extra,
});

describe("costOfRate", () => {
  it("is salary × (1 + fringe)", () => {
    expect(costOfRate({ salary: 10000, fringeRate: 0.385 })).toBeCloseTo(13850);
  });
});

describe("pricingOf", () => {
  it("prices a person with two job codes at the higher cost", () => {
    const pricing = pricingOf(["9754", "9753"], ratesByJobCode);

    expect(pricing.jobCode).toBe("9753");
  });

  it("compares cost including fringe", () => {
    const rates = ratesOf(
      jobCodeRate("A", 10000, { fringeRate: 0 }),
      jobCodeRate("B", 8000, { fringeRate: 0.5 }),
    );

    expect(pricingOf(["A", "B"], rates).jobCode).toBe("B");
  });

  it("prefers a rated job code over an unrated one", () => {
    expect(pricingOf(["9517", "9754"], ratesByJobCode).jobCode).toBe("9754");
  });

  it("prefers a grad job code when every job code is unrated", () => {
    const rates = ratesOf(
      jobCodeRate("2221", null),
      gradJobCodeRate("9511", "teaching_assistant", "regular"),
    );

    expect(pricingOf(["2221", "9511"], rates).jobCode).toBe("9511");
  });

  it("has no job code for a person with none in the department", () => {
    expect(pricingOf([], ratesByJobCode)).toMatchObject({
      jobCode: null,
      rate: null,
    });
  });
});

describe("jobCodeRateOf", () => {
  it("is the admin's salary and fringe", () => {
    expect(jobCodeRateOf("9753", termRatesOf())).toEqual({
      salary: 10000,
      fringeRate: 0.385,
    });
  });

  it("is null while either field is missing", () => {
    const termRates = termRatesOf({
      ratesByJobCode: ratesOf(jobCodeRate("9517", 7000, { fringeRate: null })),
    });

    expect(jobCodeRateOf("9517", termRates)).toBeNull();
    expect(jobCodeRateOf("9999", termRatesOf())).toBeNull();
  });
});

describe("instructorRateOf", () => {
  it("costs a lecturer at the rate for the job code", () => {
    const pricing = pricingOf(["9753"], ratesByJobCode);

    expect(instructorRateOf(pricing, termRatesOf())).toEqual({
      salary: 10000,
      fringeRate: 0.385,
    });
  });

  it("costs a job code with no rate at the TBA rate", () => {
    const pricing = pricingOf(["9517"], ratesByJobCode);

    expect(instructorRateOf(pricing, termRatesOf())).toEqual({
      salary: 10000,
      fringeRate: 0,
    });
  });

  it("is null when neither the job code nor TBA has a rate", () => {
    const pricing = pricingOf(["9517"], ratesOf(lecturer));
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
    const pricing = pricingOf(["9511"], ratesByJobCode);

    expect(taRateOf(pricing, termRatesOf())).toEqual({
      salary: 5000,
      fringeRate: 1,
    });
  });

  it("does not fall back to TBA", () => {
    const pricing = pricingOf(["9517"], ratesByJobCode);

    expect(taRateOf(pricing, termRatesOf())).toBeNull();
  });

  it("is null for a person with no job code", () => {
    const pricing = pricingOf([], ratesByJobCode);

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

describe("isGradJobCodeRate", () => {
  it("is true for teaching assistant and grad instructor codes only", () => {
    expect(
      isGradJobCodeRate(gradJobCodeRate("9519", "teaching_assistant", "abd")),
    ).toBe(true);
    expect(
      isGradJobCodeRate(
        gradJobCodeRate("9515", "graduate_instructor", "regular"),
      ),
    ).toBe(true);
    expect(isGradJobCodeRate(jobCodeRate("9753", 10000))).toBe(false);
    expect(isGradJobCodeRate(null)).toBe(false);
  });
});
