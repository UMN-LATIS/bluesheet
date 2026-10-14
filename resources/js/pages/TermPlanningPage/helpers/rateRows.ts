import type { CostAssumptions, InstructorType, JobCodeRate } from "@/types";
import type { RateOverrides } from "./costOverrides";
import { costOfRate, UNSTAFFED_JOB_CODE } from "./costRules";

export interface RateCell {
  /**
   * The term's value, else Nova's. Null when neither
   * exists.
   */
  amount: number | null;
  /** Null when Nova has no value. */
  novaAmount: number | null;
  isOverridden: boolean;
}

export interface RateRow {
  code: string;
  title: string;
  fundLabel: string;
  perLabel: "Section" | "Course";
  salary: RateCell;
  fringeRate: RateCell;
  /** Salary × (1 + fringe). Null when either is missing. */
  cost: number | null;
  isRecurring: boolean;
}

const FUND_LABELS: Record<InstructorType, string> = {
  recurring_budget_faculty: "Recurring",
  recurring_budget_pa: "Recurring",
  contract_visiting: "UI",
  pa_instructor: "UI",
  graduate_instructor: "TA/GI",
  teaching_assistant: "TA/GI",
};

export const fundLabelOf = (instructorType: InstructorType | null) =>
  instructorType ? FUND_LABELS[instructorType] : "—";

const isRecurringType = (instructorType: InstructorType | null) =>
  instructorType === "recurring_budget_faculty" ||
  instructorType === "recurring_budget_pa";

function rateCellOf(
  overrideAmount: number | null | undefined,
  novaAmount: number | null | undefined,
): RateCell {
  const nova = novaAmount ?? null;
  const override = overrideAmount ?? null;

  return {
    amount: override ?? nova,
    novaAmount: nova,
    isOverridden: override !== null,
  };
}

const isGradType = (instructorType: InstructorType | null) =>
  instructorType === "teaching_assistant" ||
  instructorType === "graduate_instructor";

const isGradRate = (rate: JobCodeRate | undefined) =>
  isGradType(rate?.instructorType ?? null);

function rateRowOf(
  code: string,
  title: string,
  rate: JobCodeRate | undefined,
  overrides: RateOverrides,
): RateRow {
  const override = overrides.jobCodeRates.get(code);
  const salary = rateCellOf(override?.salary, rate?.salary);
  const fringeRate = rateCellOf(override?.fringeRate, rate?.fringeRate);
  const instructorType = rate?.instructorType ?? null;
  const hasBoth = salary.amount !== null && fringeRate.amount !== null;

  return {
    code,
    title,
    fundLabel: fundLabelOf(instructorType),
    perLabel: instructorType === "teaching_assistant" ? "Course" : "Section",
    salary,
    fringeRate,
    cost: hasBoth
      ? costOfRate({
          salary: salary.amount ?? 0,
          fringeRate: fringeRate.amount ?? 0,
        })
      : null,
    isRecurring: isRecurringType(instructorType),
  };
}

/**
 * The non-grad codes held by anyone charged this term,
 * then TBA.
 */
export function rateRowsOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
  chargedEmplids: Set<number>,
): RateRow[] {
  const ratesByCode = new Map(
    assumptions.jobCodes.map((rate) => [rate.code, rate]),
  );
  const charged = assumptions.people.filter(({ emplid }) =>
    chargedEmplids.has(emplid),
  );
  const heldCodes = [
    ...new Set(charged.flatMap(({ jobCodes }) => jobCodes)),
  ].sort();
  const positionTitleOf = (code: string) =>
    charged.map(({ positionTitles }) => positionTitles[code]).find(Boolean);

  return [...heldCodes, UNSTAFFED_JOB_CODE]
    .filter((code) => !isGradRate(ratesByCode.get(code)))
    .map((code) => {
      const rate = ratesByCode.get(code);
      const title =
        code === UNSTAFFED_JOB_CODE
          ? "Unstaffed"
          : (rate?.title ?? positionTitleOf(code) ?? "Unknown");

      return rateRowOf(code, title, rate, overrides);
    });
}

export const GRAD_APPOINTMENT_PERCENTS = [25, 50, 75];

export interface GradRateRow extends RateRow {
  /** The cost of the appointment, which `cost` prices at 25%. */
  costByAppointmentPercent: { percent: number; cost: number | null }[];
}

/** Every grad code, whether or not anyone holds it this term. */
export function gradRateRowsOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
): GradRateRow[] {
  return assumptions.jobCodes
    .filter(isGradRate)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((rate) => {
      const row = rateRowOf(rate.code, rate.title, rate, overrides);

      return {
        ...row,
        costByAppointmentPercent: GRAD_APPOINTMENT_PERCENTS.map((percent) => ({
          percent,
          cost:
            row.cost === null
              ? null
              : row.cost * (percent / GRAD_APPOINTMENT_PERCENTS[0]),
        })),
      };
    });
}
