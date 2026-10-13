import type { CostAssumptions, InstructorType, StudentStatus } from "@/types";
import {
  taRateKeyOf,
  type RateIdentity,
  type RateOverrides,
} from "./costOverrides";
import { TA_APPOINTMENT_PERCENT, UNSTAFFED_JOB_CODE } from "./costRules";

export interface RateRow {
  rate: RateIdentity;
  code: string;
  title: string;
  fundLabel: string;
  /**
   * The term's rate, else Nova's. Null when neither
   * exists.
   */
  amount: number | null;
  /** Null when Nova has no rate. */
  novaAmount: number | null;
  isOverriddenForTerm: boolean;
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

export function rateRowsOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
  instructorEmplids: Set<number>,
): RateRow[] {
  return [
    ...jobCodeRowsOf(assumptions, overrides, instructorEmplids),
    ...taRowsOf(assumptions, overrides),
  ];
}

function jobCodeRowsOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
  instructorEmplids: Set<number>,
): RateRow[] {
  const ratesByCode = new Map(
    assumptions.jobCodes.map((rate) => [rate.code, rate]),
  );
  const instructors = assumptions.people.filter(({ emplid }) =>
    instructorEmplids.has(emplid),
  );
  const heldCodes = [
    ...new Set(instructors.flatMap(({ jobCodes }) => jobCodes)),
  ].sort();
  const positionTitleOf = (code: string) =>
    instructors.map(({ positionTitles }) => positionTitles[code]).find(Boolean);

  return [...heldCodes, UNSTAFFED_JOB_CODE].map((code) => {
    const rate = ratesByCode.get(code);
    const novaAmount = rate?.costPerCourse ?? null;
    const termAmount = overrides.costPerCourseByJobCode.get(code);

    return {
      rate: { kind: "jobCode", jobCode: code },
      code,
      title:
        code === UNSTAFFED_JOB_CODE
          ? "Unstaffed"
          : (rate?.title ?? positionTitleOf(code) ?? "Not in Nova"),
      fundLabel: fundLabelOf(rate?.instructorType ?? null),
      amount: termAmount ?? novaAmount,
      novaAmount,
      isOverriddenForTerm: termAmount !== undefined,
    };
  });
}

const TA_TITLES: Record<StudentStatus, string> = {
  regular: `${TA_APPOINTMENT_PERCENT}% appointment`,
  abd: `${TA_APPOINTMENT_PERCENT}% appointment, ABD`,
};

function taRowsOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
): RateRow[] {
  const statuses: StudentStatus[] = ["regular", "abd"];

  return statuses.map((studentStatus) => {
    const novaRate = assumptions.taRates.rates.find(
      (rate) =>
        rate.season === assumptions.season &&
        rate.studentStatus === studentStatus &&
        rate.appointmentPercent === TA_APPOINTMENT_PERCENT,
    );
    const novaAmount = novaRate?.costPerTerm ?? null;
    const termAmount = overrides.costPerTermByTaRateKey.get(
      taRateKeyOf(TA_APPOINTMENT_PERCENT, studentStatus),
    );

    return {
      rate: {
        kind: "taAppointment",
        appointmentPercent: TA_APPOINTMENT_PERCENT,
        studentStatus,
      },
      code: "TA",
      title: TA_TITLES[studentStatus],
      fundLabel: "TA/GI",
      amount: termAmount ?? novaAmount,
      novaAmount,
      isOverriddenForTerm: termAmount !== undefined,
    };
  });
}
