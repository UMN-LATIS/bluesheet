import type {
  JobCodeRate,
  Season,
  StudentStatus,
  TaAppointmentRate,
} from "@/types";
import type { CostBasis } from "./costBasis";
import { taRateKeyOf, type RateOverrides } from "./costOverrides";

export const UNSTAFFED_JOB_CODE = "TBA";

export const TA_APPOINTMENT_PERCENT = 25;

const FREE_COMPONENTS = ["IND", "FWK"];

export const isFreeComponent = (component: string) =>
  FREE_COMPONENTS.includes(component);

export interface PersonPricing {
  jobCode: string | null;
  jobCodeCount: number;
  rate: JobCodeRate | null;
  studentStatus: StudentStatus;
}

export interface TermRates {
  ratesByJobCode: Map<string, JobCodeRate>;
  overrides: RateOverrides;
  season: Season;
  taRates: TaAppointmentRate[];
  taRateFiscalYear: number | null;
}

/** The amount is null when no rate exists. */
export interface PricedLine {
  amount: number | null;
  basis: CostBasis;
}

interface CourseRate {
  amount: number;
  /** Null when the term's override is the amount. */
  rateFiscalYear: number | null;
}

export function pricingOf(
  jobCodesHeld: string[],
  ratesByJobCode: Map<string, JobCodeRate>,
): PersonPricing {
  const jobCode = highestRateJobCode(jobCodesHeld, ratesByJobCode);
  const isAbd = jobCodesHeld.some(
    (code) => ratesByJobCode.get(code)?.studentStatus === "abd",
  );

  return {
    jobCode,
    jobCodeCount: jobCodesHeld.length,
    rate: jobCode === null ? null : (ratesByJobCode.get(jobCode) ?? null),
    studentStatus: isAbd ? "abd" : "regular",
  };
}

const UNRATED_SORTS_LAST = -1;

function highestRateJobCode(
  jobCodes: string[],
  ratesByJobCode: Map<string, JobCodeRate>,
): string | null {
  const costOf = (jobCode: string) =>
    ratesByJobCode.get(jobCode)?.costPerCourse ?? UNRATED_SORTS_LAST;

  return [...jobCodes].sort((a, b) => costOf(b) - costOf(a))[0] ?? null;
}

function courseRateOf(
  jobCode: string,
  termRates: TermRates,
): CourseRate | null {
  const termAmount = termRates.overrides.costPerCourseByJobCode.get(jobCode);
  if (termAmount !== undefined)
    return { amount: termAmount, rateFiscalYear: null };

  const rate = termRates.ratesByJobCode.get(jobCode);
  if (rate?.costPerCourse == null) return null;

  return { amount: rate.costPerCourse, rateFiscalYear: rate.rateFiscalYear };
}

const unstaffedAmountOf = (termRates: TermRates) =>
  courseRateOf(UNSTAFFED_JOB_CODE, termRates)?.amount ?? null;

export function costOfUnstaffedSection(termRates: TermRates): PricedLine {
  return {
    amount: unstaffedAmountOf(termRates),
    basis: { kind: "unstaffedSection" },
  };
}

export function costOfLeadInstructor(
  pricing: PersonPricing,
  termRates: TermRates,
): PricedLine {
  const { jobCode } = pricing;
  const unratedLine = (): PricedLine => ({
    amount: unstaffedAmountOf(termRates),
    basis: { kind: "unratedJobCode", jobCode },
  });

  if (jobCode === null) return unratedLine();

  const rate = courseRateOf(jobCode, termRates);
  if (rate === null) return unratedLine();

  return {
    amount: rate.amount,
    basis: {
      kind: "jobCodeRate",
      jobCode,
      title: pricing.rate?.title ?? null,
      rateFiscalYear: rate.rateFiscalYear,
      jobCodeCount: pricing.jobCodeCount,
    },
  };
}

export function costOfTaAppointment(
  pricing: PersonPricing,
  termRates: TermRates,
): PricedLine {
  const { studentStatus } = pricing;
  const appointment = {
    appointmentPercent: TA_APPOINTMENT_PERCENT,
    season: termRates.season,
    studentStatus,
  };

  const termAmount = termRates.overrides.costPerTermByTaRateKey.get(
    taRateKeyOf(TA_APPOINTMENT_PERCENT, studentStatus),
  );
  if (termAmount !== undefined) {
    return {
      amount: termAmount,
      basis: { kind: "taAppointment", ...appointment, rateFiscalYear: null },
    };
  }

  const rate = termRates.taRates.find(
    (candidate) =>
      candidate.season === termRates.season &&
      candidate.studentStatus === studentStatus &&
      candidate.appointmentPercent === TA_APPOINTMENT_PERCENT,
  );
  if (!rate)
    return { amount: null, basis: { kind: "noTaRate", ...appointment } };

  return {
    amount: rate.costPerTerm,
    basis: {
      kind: "taAppointment",
      ...appointment,
      rateFiscalYear: termRates.taRateFiscalYear,
    },
  };
}
