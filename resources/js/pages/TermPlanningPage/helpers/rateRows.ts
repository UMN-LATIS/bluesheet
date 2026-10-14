import type {
  CostAssumptions,
  GradRateInputs,
  InstructorType,
  JobCodeRate,
} from "@/types";
import type { RateOverrides } from "./costOverrides";
import { costOfRate, isGradJobCodeRate, UNSTAFFED_JOB_CODE } from "./costRules";
import {
  defaultAppointmentOf,
  gradCostOf,
  gradTermOf,
  type GradCost,
} from "./gradCost";

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
  perLabel: "Section";
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
    perLabel: "Section",
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
    .filter((code) => !isGradJobCodeRate(ratesByCode.get(code) ?? null))
    .map((code) => {
      const rate = ratesByCode.get(code);
      const title =
        code === UNSTAFFED_JOB_CODE
          ? "Unstaffed"
          : (rate?.title ?? positionTitleOf(code) ?? "Unknown");

      return rateRowOf(code, title, rate, overrides);
    });
}

export interface GradInputTile {
  field: keyof GradRateInputs;
  label: string;
  kind: "dollars" | "percent";
  /** Its novaAmount is the admin's value. */
  cell: RateCell;
}

export interface GradHoursTile {
  appointmentPercent: number;
  /** Its novaAmount is the admin's hours. */
  hours: RateCell;
}

export interface GradRateRow {
  code: string;
  title: string;
  fundLabel: string;
  isAbd: boolean;
  isGradInstructor: boolean;
  /**
   * At the term's default appointment, before offsets and
   * per-credit pay. Null when an input or the hours are
   * missing.
   */
  cost: GradCost | null;
}

export interface GradRates {
  inputs: GradInputTile[];
  hours: GradHoursTile[];
  defaultAppointmentPercent: number;
  isDefaultAppointmentOverridden: boolean;
  rows: GradRateRow[];
}

const GRAD_INPUT_LABELS: Omit<GradInputTile, "cell">[] = [
  { field: "hourlyRate", label: "Hourly rate", kind: "dollars" },
  { field: "healthRate", label: "GA health, of pay", kind: "percent" },
  {
    field: "tuitionPerHourRegular",
    label: "Tuition per hour, regular",
    kind: "dollars",
  },
  {
    field: "tuitionPerHourAbd",
    label: "Tuition per hour, ABD",
    kind: "dollars",
  },
  { field: "feeOffset", label: "Student fee offset", kind: "dollars" },
  {
    field: "internationalOffset",
    label: "International GA offset",
    kind: "dollars",
  },
  {
    field: "perCreditPayment",
    label: "Grad instructor, per credit",
    kind: "dollars",
  },
];

export function gradRatesOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
): GradRates {
  const term = gradTermOf(assumptions, overrides);
  const defaultAppointmentPercent = defaultAppointmentOf(overrides);

  const inputs = GRAD_INPUT_LABELS.map((input) => ({
    ...input,
    cell: rateCellOf(
      overrides.gradInputs[input.field],
      assumptions.gradRates.defaults?.[input.field],
    ),
  }));

  const hours = [...assumptions.gradRates.levels]
    .sort((a, b) => a.appointmentPercent - b.appointmentPercent)
    .map(({ appointmentPercent, hours: adminHours }) => ({
      appointmentPercent,
      hours: rateCellOf(
        overrides.gradHoursByPercent.get(appointmentPercent),
        adminHours,
      ),
    }));

  const rows = assumptions.jobCodes
    .filter(isGradJobCodeRate)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(({ code, title, instructorType, studentStatus }) => {
      const isAbd = studentStatus === "abd";

      return {
        code,
        title,
        fundLabel: fundLabelOf(instructorType),
        isAbd,
        isGradInstructor: instructorType === "graduate_instructor",
        cost: gradCostOf(term, {
          appointmentPercent: defaultAppointmentPercent,
          isAbd,
          hasFeeOffset: false,
          isInternational: false,
          creditsTaught: 0,
        }),
      };
    });

  return {
    inputs,
    hours,
    defaultAppointmentPercent,
    isDefaultAppointmentOverridden:
      overrides.defaultAppointmentPercent !== null,
    rows,
  };
}
