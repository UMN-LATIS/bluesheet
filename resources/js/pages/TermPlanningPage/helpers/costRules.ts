import type { JobCodeRate } from "@/types";

export const UNSTAFFED_JOB_CODE = "TBA";

export const LECTURE = "LEC";

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

/**
 * Null when the job code has no salary or no fringe rate.
 */
export function rateOfJobCode(
  jobCode: string,
  ratesByJobCode: Map<string, JobCodeRate>,
): Rate | null {
  const adminRate = ratesByJobCode.get(jobCode);
  const salary = adminRate?.salary ?? null;
  const fringeRate = adminRate?.fringeRate ?? null;
  if (salary === null || fringeRate === null) return null;

  return { salary, fringeRate };
}

export function pricingOf(
  jobCodesHeld: string[],
  ratesByJobCode: Map<string, JobCodeRate>,
): PersonPricing {
  const jobCode = highestRateJobCode(jobCodesHeld, ratesByJobCode);

  return {
    jobCode,
    rate: jobCode === null ? null : (ratesByJobCode.get(jobCode) ?? null),
  };
}

const UNRATED_COST = -1;

function highestRateJobCode(
  jobCodes: string[],
  ratesByJobCode: Map<string, JobCodeRate>,
): string | null {
  const costOf = (jobCode: string) => {
    const rate = rateOfJobCode(jobCode, ratesByJobCode);
    return rate === null ? UNRATED_COST : costOfRate(rate);
  };
  const gradFirst = (jobCode: string) =>
    isGradJobCodeRate(ratesByJobCode.get(jobCode) ?? null) ? 0 : 1;
  const byCostDescending = (a: string, b: string) =>
    costOf(b) - costOf(a) || gradFirst(a) - gradFirst(b);

  const sortedByCost = [...jobCodes].sort(byCostDescending);

  return sortedByCost[0] ?? null;
}

export const unstaffedRateOf = (ratesByJobCode: Map<string, JobCodeRate>) =>
  rateOfJobCode(UNSTAFFED_JOB_CODE, ratesByJobCode);

/** Null when neither the job code nor TBA has a rate. */
export function instructorRateOf(
  pricing: PersonPricing,
  ratesByJobCode: Map<string, JobCodeRate>,
): Rate | null {
  const jobCodeRate =
    pricing.jobCode === null
      ? null
      : rateOfJobCode(pricing.jobCode, ratesByJobCode);

  return jobCodeRate ?? unstaffedRateOf(ratesByJobCode);
}

/**
 * Null when the job code has no rate. A TA never falls back
 * to TBA.
 */
export function taRateOf(
  pricing: PersonPricing,
  ratesByJobCode: Map<string, JobCodeRate>,
): Rate | null {
  if (pricing.jobCode === null) return null;

  return rateOfJobCode(pricing.jobCode, ratesByJobCode);
}
