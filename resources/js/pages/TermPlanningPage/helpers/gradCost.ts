import type { CostAssumptions, GradRateInputs } from "@/types";
import type { RateOverrides } from "./costOverrides";

export const STANDARD_APPOINTMENT_PERCENT = 25;

/** The appointment one section adds. */
export const defaultAppointmentOf = (
  overrides: Pick<RateOverrides, "defaultAppointmentPercent">,
) => overrides.defaultAppointmentPercent ?? STANDARD_APPOINTMENT_PERCENT;

export const MAX_APPOINTMENT_FROM_SECTIONS_PERCENT = 50;

/**
 * Each paid section adds `perSectionPercent`, up to 50%, or
 * up to `perSectionPercent` when that is higher.
 */
export const appointmentForSectionsOf = (
  sectionCount: number,
  perSectionPercent: number,
) =>
  Math.min(
    perSectionPercent * Math.max(sectionCount, 1),
    Math.max(perSectionPercent, MAX_APPOINTMENT_FROM_SECTIONS_PERCENT),
  );

export const FEE_OFFSET_ABD_REASON =
  "ABD job codes are ineligible for the student fee offset";

export interface GradTerm {
  inputs: GradRateInputs;
  hoursByAppointmentPercent: Map<number, number>;
}

export interface GradStudent {
  appointmentPercent: number;
  isAbd: boolean;
  hasFeeOffset: boolean;
  isInternational: boolean;
  /** Only a grad instructor has credits. */
  creditsTaught: number;
}

export interface GradCost {
  inputs: GradRateInputs;
  offsetShare: number;
  tuitionPerHour: number;
  hours: number;
  /** Hourly rate times hours, before offsets. */
  base: number;
  feeOffset: number;
  internationalOffset: number;
  instructorPay: number;
  /** Base, offsets, and instructor pay. */
  pay: number;
  health: number;
  tuition: number;
  /** Health plus tuition. */
  fringe: number;
  total: number;
}

/**
 * The fraction of a full offset paid at an appointment:
 * 0.25 under 25%, 0.5 from 25% to under 50%, else 1.
 */
export function offsetShareOf(appointmentPercent: number): number {
  if (appointmentPercent < 25) return 0.25;
  if (appointmentPercent < 50) return 0.5;

  return 1;
}

/**
 * Null when the term has no grad inputs or no hours for the
 * appointment.
 */
export function gradCostOf(
  term: GradTerm | null,
  student: GradStudent,
): GradCost | null {
  const hours = term?.hoursByAppointmentPercent.get(student.appointmentPercent);
  if (term === null || hours === undefined) return null;

  const { inputs } = term;
  const share = offsetShareOf(student.appointmentPercent);
  const base = inputs.hourlyRate * hours;
  const feeOffset =
    student.hasFeeOffset && !student.isAbd ? inputs.feeOffset * share : 0;
  const internationalOffset = student.isInternational
    ? inputs.internationalOffset * share
    : 0;
  const instructorPay = student.creditsTaught * inputs.perCreditPayment;
  const pay = base + feeOffset + internationalOffset + instructorPay;
  const health = inputs.healthRate * pay;
  const tuitionPerHour = student.isAbd
    ? inputs.tuitionPerHourAbd
    : inputs.tuitionPerHourRegular;
  const tuition = tuitionPerHour * hours;
  const fringe = health + tuition;

  return {
    inputs,
    offsetShare: share,
    tuitionPerHour,
    hours,
    base,
    feeOffset,
    internationalOffset,
    instructorPay,
    pay,
    health,
    tuition,
    fringe,
    total: pay + fringe,
  };
}

const GRAD_INPUT_FIELDS: (keyof GradRateInputs)[] = [
  "hourlyRate",
  "healthRate",
  "tuitionPerHourRegular",
  "tuitionPerHourAbd",
  "feeOffset",
  "internationalOffset",
  "perCreditPayment",
];

/** The department's value over the admin's, field by field. */
export function gradInputOf(
  field: keyof GradRateInputs,
  assumptions: CostAssumptions,
  overrides: RateOverrides,
): number | null {
  return (
    overrides.gradInputs[field] ??
    assumptions.gradRates.defaults?.[field] ??
    null
  );
}

export function gradHoursOf(
  appointmentPercent: number,
  assumptions: CostAssumptions,
  overrides: RateOverrides,
): number | null {
  const adminHours = assumptions.gradRates.levels.find(
    (level) => level.appointmentPercent === appointmentPercent,
  )?.hours;

  return (
    overrides.gradHoursByPercent.get(appointmentPercent) ?? adminHours ?? null
  );
}

/** Null when any input is missing. */
export function gradTermOf(
  assumptions: CostAssumptions,
  overrides: RateOverrides,
): GradTerm | null {
  const inputs: Partial<GradRateInputs> = {};
  for (const field of GRAD_INPUT_FIELDS) {
    const value = gradInputOf(field, assumptions, overrides);
    if (value === null) return null;
    inputs[field] = value;
  }

  const hoursByAppointmentPercent = new Map<number, number>();
  for (const { appointmentPercent } of assumptions.gradRates.levels) {
    const hours = gradHoursOf(appointmentPercent, assumptions, overrides);
    if (hours !== null)
      hoursByAppointmentPercent.set(appointmentPercent, hours);
  }

  return { inputs: inputs as GradRateInputs, hoursByAppointmentPercent };
}
