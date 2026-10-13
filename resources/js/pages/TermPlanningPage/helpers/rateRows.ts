import type {
  CostAssumptions,
  InstructorType,
  JobCodeRate,
  StudentStatus,
} from "@/types";
import { INSTRUCTOR_TYPE_LABELS } from "./costBasis";
import { taRateKeyOf, type RateOverrides, type RateRef } from "./costOverrides";
import { UNSTAFFED_JOB_CODE } from "./costRules";
import { fiscalYearLabel } from "./fiscalYear";
import { formatWholeDollars } from "./money";

export interface RateCell {
  rate: RateRef;
  /** The term's rate, else Nova's. Null when neither exists. */
  amount: number | null;
  /** Null when Nova has no rate. */
  novaAmount: number | null;
  isChangedForTerm: boolean;
}

export interface JobCodeRateRow extends RateCell {
  code: string;
  title: string;
  instructorTypeLabel: string;
  fundLabel: string;
  source: string;
}

export interface TaRateRow {
  appointmentPercent: number;
  hoursPerTerm: number;
  cells: Record<StudentStatus, RateCell>;
}

const FUND_LABELS: Record<InstructorType, string> = {
  recurring_budget_faculty: "Recurring",
  recurring_budget_pa: "Recurring",
  contract_visiting: "UI",
  pa_instructor: "UI",
  graduate_instructor: "TA/GI",
  teaching_assistant: "TA/GI",
};

const HOURS_PER_FULL_APPOINTMENT = 784;

export function jobCodeRateRowsOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
  instructorEmplids: Set<number>,
  termName: string,
): JobCodeRateRow[] {
  const ratesByCode = new Map(
    assumptions.jobCodes.map((rate) => [rate.code, rate]),
  );
  const instructors = assumptions.people.filter(({ emplid }) =>
    instructorEmplids.has(emplid),
  );
  const isPricedPerAppointment = (code: string) =>
    ratesByCode.get(code)?.instructorType === "teaching_assistant";
  const heldCodes = [
    ...new Set(instructors.flatMap(({ jobCodes }) => jobCodes)),
  ]
    .filter((code) => !isPricedPerAppointment(code))
    .sort();
  const positionTitleOf = (code: string) =>
    instructors.find(({ positionTitles }) => positionTitles[code])
      ?.positionTitles[code];

  const rowOf = (code: string): JobCodeRateRow => {
    const rate = ratesByCode.get(code);
    const novaAmount = rate?.costPerCourse ?? null;
    const termAmount = overrides.costPerCourseByJobCode.get(code);
    const isChangedForTerm = termAmount !== undefined;

    return {
      rate: { kind: "jobCode", jobCode: code },
      code,
      title: rate?.title ?? positionTitleOf(code) ?? "Not in Nova",
      instructorTypeLabel: rate?.instructorType
        ? INSTRUCTOR_TYPE_LABELS[rate.instructorType]
        : "—",
      fundLabel: rate?.instructorType ? FUND_LABELS[rate.instructorType] : "—",
      amount: termAmount ?? novaAmount,
      novaAmount,
      isChangedForTerm,
      source: isChangedForTerm
        ? `Changed for ${termName} · ${wasLabelOf(novaAmount)}`
        : novaSourceOf(code, rate, assumptions.fiscalYear),
    };
  };

  return [...heldCodes, UNSTAFFED_JOB_CODE].map(rowOf);
}

export function taRateRowsOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
): TaRateRow[] {
  const seasonRates = assumptions.taRates.rates.filter(
    ({ season }) => season === assumptions.season,
  );
  const percents = [
    ...new Set(seasonRates.map(({ appointmentPercent }) => appointmentPercent)),
  ].sort((a, b) => a - b);

  const cellOf = (
    appointmentPercent: number,
    studentStatus: StudentStatus,
  ): RateCell => {
    const novaAmount =
      seasonRates.find(
        (rate) =>
          rate.appointmentPercent === appointmentPercent &&
          rate.studentStatus === studentStatus,
      )?.costPerTerm ?? null;
    const termAmount = overrides.costPerTermByTaRateKey.get(
      taRateKeyOf(appointmentPercent, studentStatus),
    );

    return {
      rate: { kind: "taAppointment", appointmentPercent, studentStatus },
      amount: termAmount ?? novaAmount,
      novaAmount,
      isChangedForTerm: termAmount !== undefined,
    };
  };

  return percents.map((appointmentPercent) => ({
    appointmentPercent,
    hoursPerTerm: Math.round(
      (appointmentPercent / 100) * HOURS_PER_FULL_APPOINTMENT,
    ),
    cells: {
      regular: cellOf(appointmentPercent, "regular"),
      abd: cellOf(appointmentPercent, "abd"),
    },
  }));
}

export const wasLabelOf = (novaAmount: number | null) =>
  novaAmount === null
    ? "no rate in Nova"
    : `was ${formatWholeDollars(novaAmount)}`;

function novaSourceOf(
  code: string,
  rate: JobCodeRate | undefined,
  fiscalYear: number,
): string {
  if (rate?.costPerCourse == null) {
    return code === UNSTAFFED_JOB_CODE
      ? "No rate in Nova · unstaffed sections show No rate"
      : "No rate in Nova · costs the Unstaffed rate";
  }

  const { rateFiscalYear } = rate;
  if (rateFiscalYear === null || rateFiscalYear === fiscalYear) {
    return rate.source ?? "";
  }

  return `${fiscalYearLabel(rateFiscalYear)} rate · ${fiscalYearLabel(fiscalYear)} not entered yet`;
}
