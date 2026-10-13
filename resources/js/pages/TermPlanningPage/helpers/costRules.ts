import type {
  JobCodeRate,
  Season,
  StudentStatus,
  TaAppointmentRate,
} from "@/types";
import { taRateKeyOf, type RateOverrides } from "./costOverrides";

export const UNSTAFFED_JOB_CODE = "TBA";

export const TA_APPOINTMENT_PERCENT = 25;

const FREE_COMPONENTS = ["IND", "FWK"];

export const isFreeComponent = (component: string) =>
  FREE_COMPONENTS.includes(component);

export interface PersonPricing {
  jobCode: string | null;
  rate: JobCodeRate | null;
  studentStatus: StudentStatus;
}

export interface TermRates {
  ratesByJobCode: Map<string, JobCodeRate>;
  overrides: RateOverrides;
  season: Season;
  taRates: TaAppointmentRate[];
}

export function pricingOf(
  jobCodesHeld: string[],
  ratesByJobCode: Map<string, JobCodeRate>,
  overrides: RateOverrides,
): PersonPricing {
  const jobCode = highestRateJobCode(jobCodesHeld, ratesByJobCode, overrides);
  const isAbd = jobCodesHeld.some(
    (code) => ratesByJobCode.get(code)?.studentStatus === "abd",
  );

  return {
    jobCode,
    rate: jobCode === null ? null : (ratesByJobCode.get(jobCode) ?? null),
    studentStatus: isAbd ? "abd" : "regular",
  };
}

const UNRATED_SORTS_LAST = -1;

function highestRateJobCode(
  jobCodes: string[],
  ratesByJobCode: Map<string, JobCodeRate>,
  overrides: RateOverrides,
): string | null {
  const costOf = (jobCode: string) =>
    overrides.costPerCourseByJobCode.get(jobCode) ??
    ratesByJobCode.get(jobCode)?.costPerCourse ??
    UNRATED_SORTS_LAST;

  return [...jobCodes].sort((a, b) => costOf(b) - costOf(a))[0] ?? null;
}

/** Null when neither the term nor Nova has a rate. */
export function jobCodeRateOf(
  jobCode: string,
  termRates: TermRates,
): number | null {
  return (
    termRates.overrides.costPerCourseByJobCode.get(jobCode) ??
    termRates.ratesByJobCode.get(jobCode)?.costPerCourse ??
    null
  );
}

export const unstaffedRateOf = (termRates: TermRates) =>
  jobCodeRateOf(UNSTAFFED_JOB_CODE, termRates);

/** Null when neither the job code nor TBA has a rate. */
export function instructorRateOf(
  pricing: PersonPricing,
  termRates: TermRates,
): number | null {
  const jobCodeRate =
    pricing.jobCode === null ? null : jobCodeRateOf(pricing.jobCode, termRates);

  return jobCodeRate ?? unstaffedRateOf(termRates);
}

/** Null when neither the term nor Nova has a rate. */
export function taAppointmentRateOf(
  pricing: PersonPricing,
  termRates: TermRates,
): number | null {
  const { studentStatus } = pricing;
  const termAmount = termRates.overrides.costPerTermByTaRateKey.get(
    taRateKeyOf(TA_APPOINTMENT_PERCENT, studentStatus),
  );
  if (termAmount !== undefined) return termAmount;

  const novaRate = termRates.taRates.find(
    (rate) =>
      rate.season === termRates.season &&
      rate.studentStatus === studentStatus &&
      rate.appointmentPercent === TA_APPOINTMENT_PERCENT,
  );

  return novaRate?.costPerTerm ?? null;
}
