import type {
  CostSetting,
  CostSettingValue,
  InstructorType,
  JobCodeRate,
  PersonChoice,
  Season,
  StudentStatus,
  TaAppointmentRate,
} from "@/types";
import type { CostBasis } from "./costBasis";

export interface CostRuleSettings {
  unstaffedSectionCost: number;
  unratedJobCodeCost: number;
  taAppointmentPercent: number;
  isRecurringBudgetFree: boolean;
  isIndependentStudyFree: boolean;
  isFieldworkFree: boolean;
}

export interface PersonPricing {
  jobCode: string | null;
  jobCodeCount: number;
  chosenBy: "planner" | "highestRate";
  rate: JobCodeRate | null;
  instructorType: InstructorType | null;
  studentStatus: StudentStatus;
  overrideCost: number | null;
  overrideReason: string | null;
}

/**
 * The amount is null when no rate exists and no setting
 * stands in for one.
 */
export interface PricedLine {
  amount: number | null;
  basis: CostBasis;
}

const RECURRING_BUDGET_TYPES: InstructorType[] = [
  "recurring_budget_faculty",
  "recurring_budget_pa",
];

/**
 * A pending edit wins over the server's value, except a
 * null edit. The server's answer to clearing a value is
 * the earlier year's, which only the refetch knows.
 *
 * @throws Error when the server sent no setting for a rule
 */
export function costRuleSettingsOf(
  settings: CostSetting[],
  pendingEdits: Partial<Record<string, CostSettingValue | null>>,
): CostRuleSettings {
  const valueOf = (key: string): CostSettingValue => {
    const pending = pendingEdits[key];
    if (pending != null) return pending;

    const setting = settings.find((candidate) => candidate.key === key);
    if (!setting) throw new Error(`No cost setting is named ${key}`);

    return setting.value;
  };

  return {
    unstaffedSectionCost: Number(valueOf("unstaffedSectionCost")),
    unratedJobCodeCost: Number(valueOf("unratedJobCodeCost")),
    taAppointmentPercent: Number(valueOf("taAppointmentPercent")),
    isRecurringBudgetFree: valueOf("isRecurringBudgetFree") === true,
    isIndependentStudyFree: valueOf("isIndependentStudyFree") === true,
    isFieldworkFree: valueOf("isFieldworkFree") === true,
  };
}

export function isFreeComponent(
  component: string,
  settings: CostRuleSettings,
): boolean {
  return (
    (component === "IND" && settings.isIndependentStudyFree) ||
    (component === "FWK" && settings.isFieldworkFree)
  );
}

export function pricingOf(
  jobCodesHeld: string[],
  choice: PersonChoice | undefined,
  ratesByJobCode: Map<string, JobCodeRate>,
): PersonPricing {
  const plannerJobCode = choice?.jobCode ?? null;
  const chosenBy = plannerJobCode === null ? "highestRate" : "planner";
  const jobCode =
    plannerJobCode ?? highestRateJobCode(jobCodesHeld, ratesByJobCode);
  const rate = rateOf(jobCode, ratesByJobCode);

  return {
    jobCode,
    jobCodeCount: jobCodesHeld.length,
    chosenBy,
    rate,
    instructorType: choice?.instructorType ?? rate?.instructorType ?? null,
    studentStatus: choice?.studentStatus ?? "regular",
    overrideCost: choice?.overrideCost ?? null,
    overrideReason: choice?.overrideReason ?? null,
  };
}

function rateOf(
  jobCode: string | null,
  ratesByJobCode: Map<string, JobCodeRate>,
): JobCodeRate | null {
  if (jobCode === null) return null;

  return ratesByJobCode.get(jobCode) ?? null;
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

export function costOfLeadInstructor(
  pricing: PersonPricing,
  settings: CostRuleSettings,
): PricedLine {
  if (pricing.overrideCost !== null) {
    return {
      amount: pricing.overrideCost,
      basis: { kind: "override", reason: pricing.overrideReason },
    };
  }

  const { instructorType, rate } = pricing;
  const isRecurringBudget =
    instructorType !== null && RECURRING_BUDGET_TYPES.includes(instructorType);

  if (isRecurringBudget && settings.isRecurringBudgetFree) {
    return {
      amount: 0,
      basis: { kind: "recurringBudget", instructorType },
    };
  }

  if (rate?.costPerCourse != null && rate.rateFiscalYear !== null) {
    return {
      amount: rate.costPerCourse,
      basis: {
        kind: "jobCodeRate",
        jobCode: rate.code,
        title: rate.title,
        rateFiscalYear: rate.rateFiscalYear,
        chosenBy: pricing.chosenBy,
        jobCodeCount: pricing.jobCodeCount,
      },
    };
  }

  return {
    amount: settings.unratedJobCodeCost,
    basis: { kind: "unratedJobCode", jobCode: pricing.jobCode },
  };
}

export function costOfTaAppointment(
  pricing: PersonPricing,
  settings: CostRuleSettings,
  season: Season,
  taRates: TaAppointmentRate[],
  taRateFiscalYear: number | null,
): PricedLine {
  if (pricing.overrideCost !== null) {
    return {
      amount: pricing.overrideCost,
      basis: { kind: "override", reason: pricing.overrideReason },
    };
  }

  const appointmentPercent = settings.taAppointmentPercent;
  const rate = taRates.find(
    (candidate) =>
      candidate.season === season &&
      candidate.studentStatus === pricing.studentStatus &&
      candidate.appointmentPercent === appointmentPercent,
  );

  if (!rate) {
    return {
      amount: null,
      basis: {
        kind: "noTaRate",
        appointmentPercent,
        season,
        studentStatus: pricing.studentStatus,
      },
    };
  }

  return {
    amount: rate.costPerTerm,
    basis: {
      kind: "taAppointment",
      appointmentPercent,
      season,
      studentStatus: pricing.studentStatus,
      rateFiscalYear: taRateFiscalYear,
    },
  };
}
