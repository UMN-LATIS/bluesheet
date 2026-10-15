import type { CostAssumptions, GradRateInputs } from "@/types";

export const STANDARD_APPOINTMENT_PERCENT = 25;

/** The appointment teaching a section other than a lab or discussion adds. */
export const defaultAppointmentOf = (
  gradRates: Pick<CostAssumptions["gradRates"], "defaultAppointmentPercent">,
) => gradRates.defaultAppointmentPercent ?? STANDARD_APPOINTMENT_PERCENT;

export const TA_OR_LAB_APPOINTMENT_PERCENT = 12.5;

const LAB_AND_DISCUSSION_COMPONENTS = ["LAB", "DIS"];

export const appointmentPercentOfSection = (
  component: string,
  isTa: boolean,
  perSectionPercent: number,
) =>
  isTa || LAB_AND_DISCUSSION_COMPONENTS.includes(component)
    ? TA_OR_LAB_APPOINTMENT_PERCENT
    : perSectionPercent;

/**
 * A level's own hours, else in proportion to the nearest
 * level's. Undefined when the term has no levels.
 */
export function hoursOfAppointment(
  hoursByAppointmentPercent: Map<number, number>,
  appointmentPercent: number,
): number | undefined {
  const levelHours = hoursByAppointmentPercent.get(appointmentPercent);
  if (levelHours !== undefined) return levelHours;

  const nearest = [...hoursByAppointmentPercent].reduce<
    [number, number] | undefined
  >(
    (best, level) =>
      best === undefined ||
      Math.abs(level[0] - appointmentPercent) <
        Math.abs(best[0] - appointmentPercent)
        ? level
        : best,
    undefined,
  );
  if (nearest === undefined) return undefined;

  const [nearestPercent, nearestHours] = nearest;
  return (nearestHours * appointmentPercent) / nearestPercent;
}

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
 * Null when the term has no grad inputs or no appointment
 * levels.
 */
export function gradCostOf(
  term: GradTerm | null,
  student: GradStudent,
): GradCost | null {
  if (term === null) return null;

  const hours = hoursOfAppointment(
    term.hoursByAppointmentPercent,
    student.appointmentPercent,
  );
  if (hours === undefined) return null;

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

/** Null when any input is missing. */
export function gradTermOf(assumptions: CostAssumptions): GradTerm | null {
  const { defaults, levels } = assumptions.gradRates;
  if (defaults === null) return null;

  const hoursByAppointmentPercent = new Map(
    levels.map(({ appointmentPercent, hours }) => [appointmentPercent, hours]),
  );

  return { inputs: defaults, hoursByAppointmentPercent };
}
