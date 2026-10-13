import type { CostAssumptions, StudentStatus } from "@/types";

export type RateRef =
  | { kind: "jobCode"; jobCode: string }
  | {
      kind: "taAppointment";
      appointmentPercent: number;
      studentStatus: StudentStatus;
    };

/** A null amount restores Nova's rate. */
export interface RateOverrideEdit {
  rate: RateRef;
  amount: number | null;
}

/** A null amount restores the rate. */
export interface LineOverrideEdit {
  courseCode: string;
  section: string;
  emplid: number;
  amount: number | null;
  reason: string | null;
}

export interface RateOverrides {
  costPerCourseByJobCode: Map<string, number>;
  costPerTermByTaRateKey: Map<string, number>;
}

export interface LineOverride {
  amount: number;
  reason: string | null;
}

export const taRateKeyOf = (
  appointmentPercent: number,
  studentStatus: StudentStatus,
) => `${appointmentPercent}|${studentStatus}`;

export const rateEditKeyOf = (rate: RateRef) =>
  rate.kind === "jobCode"
    ? `jobCode|${rate.jobCode}`
    : `ta|${taRateKeyOf(rate.appointmentPercent, rate.studentStatus)}`;

export const lineOverrideKeyOf = (
  courseCode: string,
  section: string,
  emplid: number,
) => `${courseCode}|${section}|${emplid}`;

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

  for (const { rate, amount } of Object.values(edits)) {
    const [overrides, key] =
      rate.kind === "jobCode"
        ? [costPerCourseByJobCode, rate.jobCode]
        : [
            costPerTermByTaRateKey,
            taRateKeyOf(rate.appointmentPercent, rate.studentStatus),
          ];

    if (amount === null) overrides.delete(key);
    else overrides.set(key, amount);
  }

  return { costPerCourseByJobCode, costPerTermByTaRateKey };
}

export function lineOverridesByKeyOf(
  saved: CostAssumptions["lineOverrides"],
  edits: Record<string, LineOverrideEdit>,
): Map<string, LineOverride> {
  const overrides = new Map(
    saved.map(({ courseCode, section, emplid, amount, reason }) => [
      lineOverrideKeyOf(courseCode, section, emplid),
      { amount, reason },
    ]),
  );

  for (const edit of Object.values(edits)) {
    const { courseCode, section, emplid, amount, reason } = edit;
    const key = lineOverrideKeyOf(courseCode, section, emplid);
    if (amount === null) overrides.delete(key);
    else overrides.set(key, { amount, reason });
  }

  return overrides;
}
