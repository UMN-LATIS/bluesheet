import type { CostAssumptions, JobCodeRate } from "@/types";
import { INSTRUCTOR_TYPE_LABELS } from "./costBasis";
import { fiscalYearLabel } from "./fiscalYear";

export interface JobCodeRow {
  code: string;
  title: string;
  instructorTypeLabel: string;
  costPerCourse: number | null;
  isPricedPerAppointment: boolean;
  note: string;
}

export function jobCodeRowsOf(
  assumptions: CostAssumptions,
  teachingEmplids: Set<number>,
): JobCodeRow[] {
  const heldCodes = new Set(
    assumptions.people
      .filter(({ emplid }) => teachingEmplids.has(emplid))
      .flatMap(({ jobCodes }) => jobCodes),
  );
  const ratesByCode = new Map(
    assumptions.jobCodes.map((rate) => [rate.code, rate]),
  );

  return [...heldCodes].sort().map((code) => {
    const rate = ratesByCode.get(code);
    if (!rate) return unlistedCodeRow(code);

    return {
      code,
      title: rate.title,
      instructorTypeLabel: INSTRUCTOR_TYPE_LABELS[rate.instructorType],
      costPerCourse: rate.costPerCourse,
      isPricedPerAppointment: rate.instructorType === "teaching_assistant",
      note: rateNoteOf(rate, assumptions.fiscalYear),
    };
  });
}

export function rateNoteOf(rate: JobCodeRate, fiscalYear: number): string {
  const { rateFiscalYear } = rate;
  if (rateFiscalYear === null || rateFiscalYear === fiscalYear) {
    return rate.source ?? "";
  }

  return `${fiscalYearLabel(rateFiscalYear)} rate · ${fiscalYearLabel(fiscalYear)} not entered yet`;
}

function unlistedCodeRow(code: string): JobCodeRow {
  return {
    code,
    title: "Not in the job code list",
    instructorTypeLabel: "",
    costPerCourse: null,
    isPricedPerAppointment: false,
    note: "Costs the unrated job code amount below",
  };
}
