import type { JobCodeRate } from "@/types";
import type { RateOverrides } from "./costOverrides";

export const UNSTAFFED_JOB_CODE = "TBA";

const FREE_COMPONENTS = ["IND", "FWK"];

export const isFreeComponent = (component: string) =>
  FREE_COMPONENTS.includes(component);

export const isGradJobCodeRate = (rate: JobCodeRate | null): boolean =>
  rate?.instructorType === "teaching_assistant" ||
  rate?.instructorType === "graduate_instructor";

export interface Rate {
  salary: number;
  /** A fraction: 0.385 is 38.5%. */
  fringeRate: number;
}

export const costOfRate = ({ salary, fringeRate }: Rate) =>
  salary * (1 + fringeRate);

export interface PersonPricing {
  jobCode: string | null;
  rate: JobCodeRate | null;
}

export interface TermRates {
  ratesByJobCode: Map<string, JobCodeRate>;
  overrides: RateOverrides;
}

function rateOfJobCode(
  jobCode: string,
  ratesByJobCode: Map<string, JobCodeRate>,
  overrides: RateOverrides,
): Rate | null {
  const nova = ratesByJobCode.get(jobCode);
  const override = overrides.jobCodeRates.get(jobCode);
  const salary = override?.salary ?? nova?.salary ?? null;
  const fringeRate = override?.fringeRate ?? nova?.fringeRate ?? null;
  if (salary === null || fringeRate === null) return null;

  return { salary, fringeRate };
}

export function pricingOf(
  jobCodesHeld: string[],
  ratesByJobCode: Map<string, JobCodeRate>,
  overrides: RateOverrides,
): PersonPricing {
  const jobCode = highestRateJobCode(jobCodesHeld, ratesByJobCode, overrides);

  return {
    jobCode,
    rate: jobCode === null ? null : (ratesByJobCode.get(jobCode) ?? null),
  };
}

const UNRATED_SORTS_LAST = -1;

function highestRateJobCode(
  jobCodes: string[],
  ratesByJobCode: Map<string, JobCodeRate>,
  overrides: RateOverrides,
): string | null {
  const costOf = (jobCode: string) => {
    const rate = rateOfJobCode(jobCode, ratesByJobCode, overrides);
    return rate === null ? UNRATED_SORTS_LAST : costOfRate(rate);
  };

  return [...jobCodes].sort((a, b) => costOf(b) - costOf(a))[0] ?? null;
}

/**
 * The term's override over Nova's rate, field by field.
 * Null when either field is still missing.
 */
export const jobCodeRateOf = (
  jobCode: string,
  { ratesByJobCode, overrides }: TermRates,
): Rate | null => rateOfJobCode(jobCode, ratesByJobCode, overrides);

export const unstaffedRateOf = (termRates: TermRates) =>
  jobCodeRateOf(UNSTAFFED_JOB_CODE, termRates);

/** Null when neither the job code nor TBA has a rate. */
export function instructorRateOf(
  pricing: PersonPricing,
  termRates: TermRates,
): Rate | null {
  const jobCodeRate =
    pricing.jobCode === null ? null : jobCodeRateOf(pricing.jobCode, termRates);

  return jobCodeRate ?? unstaffedRateOf(termRates);
}

/** Null when the job code has no rate. A TA never falls back to TBA. */
export function taRateOf(
  pricing: PersonPricing,
  termRates: TermRates,
): Rate | null {
  if (pricing.jobCode === null) return null;

  return jobCodeRateOf(pricing.jobCode, termRates);
}
