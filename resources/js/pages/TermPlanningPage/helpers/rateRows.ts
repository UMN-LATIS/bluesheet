import type {
  CostAssumptions,
  GradRateInputs,
  InstructorType,
  JobCodeRate,
} from "@/types";
import type { RateOverrides } from "./costOverrides";
import { costOfRate, isGradJobCodeRate, UNSTAFFED_JOB_CODE } from "./costRules";
import { gradCostOf, gradTermOf, type GradStudent } from "./gradCost";

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

export interface GradInputRow {
  field: keyof GradRateInputs;
  label: string;
  hint: string;
  kind: "dollars" | "percent";
  /** Its novaAmount is the admin's value. */
  cell: RateCell;
}

export interface GradAppointmentRow {
  appointmentPercent: number;
  /** Its novaAmount is the admin's hours. */
  hours: RateCell;
  /** Pay before offsets. All the costs are null when the term has no grad inputs. */
  salary: number | null;
  health: number | null;
  regularTuition: number | null;
  regularCost: number | null;
  abdTuition: number | null;
  abdCost: number | null;
}

export interface GradRatesView {
  inputs: GradInputRow[];
  appointments: GradAppointmentRow[];
}

const GRAD_INPUT_LABELS: {
  field: keyof GradRateInputs;
  label: string;
  hint: string;
  kind: "dollars" | "percent";
}[] = [
  {
    field: "hourlyRate",
    label: "Hourly rate",
    hint: "All grad appointments",
    kind: "dollars",
  },
  {
    field: "healthRate",
    label: "GA health",
    hint: "Percent of pay",
    kind: "percent",
  },
  {
    field: "tuitionPerHourRegular",
    label: "Tuition per hour",
    hint: "Regular",
    kind: "dollars",
  },
  {
    field: "tuitionPerHourAbd",
    label: "Tuition per hour",
    hint: "ABD",
    kind: "dollars",
  },
  {
    field: "feeOffset",
    label: "Student fee offset",
    hint: "Full amount, regular only",
    kind: "dollars",
  },
  {
    field: "internationalOffset",
    label: "International GA offset",
    hint: "Full amount",
    kind: "dollars",
  },
  {
    field: "perCreditPayment",
    label: "Grad instructor payment",
    hint: "Per credit taught",
    kind: "dollars",
  },
];

const NO_OFFSETS: Omit<GradStudent, "appointmentPercent" | "isAbd"> = {
  hasFeeOffset: false,
  isInternational: false,
  creditsTaught: 0,
};

export function gradRatesViewOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
): GradRatesView {
  const term = gradTermOf(assumptions, overrides);
  const gradInstructorCodes = assumptions.jobCodes
    .filter(({ instructorType }) => instructorType === "graduate_instructor")
    .map(({ code }) => code)
    .sort();

  const inputs = GRAD_INPUT_LABELS.map((input) => ({
    ...input,
    hint:
      input.field === "perCreditPayment" && gradInstructorCodes.length > 0
        ? `${input.hint}, ${gradInstructorCodes.join(" and ")}`
        : input.hint,
    cell: rateCellOf(
      overrides.gradInputs[input.field],
      assumptions.gradRates.defaults?.[input.field],
    ),
  }));

  const appointments = [...assumptions.gradRates.levels]
    .sort((a, b) => a.appointmentPercent - b.appointmentPercent)
    .map(({ appointmentPercent, hours: adminHours }) => {
      const regular = gradCostOf(term, {
        appointmentPercent,
        isAbd: false,
        ...NO_OFFSETS,
      });
      const abd = gradCostOf(term, {
        appointmentPercent,
        isAbd: true,
        ...NO_OFFSETS,
      });

      return {
        appointmentPercent,
        hours: rateCellOf(
          overrides.gradHoursByPercent.get(appointmentPercent),
          adminHours,
        ),
        salary: regular?.pay ?? null,
        health: regular?.health ?? null,
        regularTuition: regular?.tuition ?? null,
        regularCost: regular?.total ?? null,
        abdTuition: abd?.tuition ?? null,
        abdCost: abd?.total ?? null,
      };
    });

  return { inputs, appointments };
}
