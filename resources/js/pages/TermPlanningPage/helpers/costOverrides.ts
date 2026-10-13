import type { CostAssumptions, StudentStatus } from "@/types";

export type RateIdentity =
  | { kind: "jobCode"; jobCode: string }
  | {
      kind: "taAppointment";
      appointmentPercent: number;
      studentStatus: StudentStatus;
    }
  | { kind: "person"; emplid: number };

/** A null amount restores the rate beneath it. */
export interface RateOverrideEdit {
  rate: RateIdentity;
  amount: number | null;
}

/** A null amount restores the rate. */
export interface LineOverrideEdit {
  courseCode: string;
  section: string;
  emplid: number;
  amount: number | null;
}

export interface RateOverrides {
  costPerCourseByJobCode: Map<string, number>;
  costPerTermByTaRateKey: Map<string, number>;
  costPerSectionByEmplid: Map<number, number>;
}

export const taRateKeyOf = (
  appointmentPercent: number,
  studentStatus: StudentStatus,
) => `${appointmentPercent}|${studentStatus}`;

export function rateOverrideKeyOf(rate: RateIdentity): string {
  switch (rate.kind) {
    case "jobCode":
      return `jobCode|${rate.jobCode}`;
    case "taAppointment":
      return `ta|${taRateKeyOf(rate.appointmentPercent, rate.studentStatus)}`;
    case "person":
      return `person|${rate.emplid}`;
  }
}

export const lineOverrideKeyOf = (
  courseCode: string,
  section: string,
  emplid: number,
) => `${courseCode}|${section}|${emplid}`;

function setOrDelete<Key>(
  amounts: Map<Key, number>,
  key: Key,
  amount: number | null,
): void {
  if (amount === null) amounts.delete(key);
  else amounts.set(key, amount);
}

export function rateOverridesOf(
  saved: CostAssumptions["rateOverrides"],
  edits: Record<string, RateOverrideEdit>,
): RateOverrides {
  const costPerCourseByJobCode = new Map(
    saved.jobCodes.map(({ jobCode, costPerCourse }) => [
      jobCode,
      costPerCourse,
    ]),
  );
  const costPerTermByTaRateKey = new Map(
    saved.taAppointments.map(
      ({ appointmentPercent, studentStatus, costPerTerm }) => [
        taRateKeyOf(appointmentPercent, studentStatus),
        costPerTerm,
      ],
    ),
  );
  const costPerSectionByEmplid = new Map(
    saved.people.map(({ emplid, amount }) => [emplid, amount]),
  );

  for (const { rate, amount } of Object.values(edits)) {
    switch (rate.kind) {
      case "jobCode":
        setOrDelete(costPerCourseByJobCode, rate.jobCode, amount);
        break;
      case "taAppointment":
        setOrDelete(
          costPerTermByTaRateKey,
          taRateKeyOf(rate.appointmentPercent, rate.studentStatus),
          amount,
        );
        break;
      case "person":
        setOrDelete(costPerSectionByEmplid, rate.emplid, amount);
        break;
    }
  }

  return {
    costPerCourseByJobCode,
    costPerTermByTaRateKey,
    costPerSectionByEmplid,
  };
}

export function lineOverrideAmountsByKeyOf(
  saved: CostAssumptions["lineOverrides"],
  edits: Record<string, LineOverrideEdit>,
): Map<string, number> {
  const amounts = new Map(
    saved.map(({ courseCode, section, emplid, amount }) => [
      lineOverrideKeyOf(courseCode, section, emplid),
      amount,
    ]),
  );

  for (const { courseCode, section, emplid, amount } of Object.values(edits)) {
    setOrDelete(
      amounts,
      lineOverrideKeyOf(courseCode, section, emplid),
      amount,
    );
  }

  return amounts;
}
