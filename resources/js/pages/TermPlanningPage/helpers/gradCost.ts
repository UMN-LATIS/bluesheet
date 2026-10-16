import type { CostAssumptions, GradRateInputs } from "@/types";
import type { PersonInputs } from "./personInputs";

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

export type GradOverrides = Partial<
  Pick<
    PersonInputs,
    | "hourlyRate"
    | "hours"
    | "healthRate"
    | "tuitionPerHour"
    | "feeOffset"
    | "internationalOffset"
    | "perCreditPayment"
    | "creditsTaught"
  >
>;

export type GradFigureField = keyof GradOverrides;

export type GradFigures = Record<GradFigureField, number>;

export interface GradCost {
  /** What the amounts are computed from, overrides applied. */
  figures: GradFigures;
  figuresWithoutOverrides: GradFigures;
  offsetShare: number;
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

function figuresOf(
  inputs: GradRateInputs,
  student: GradStudent,
  hoursOfLevels: number,
  overrides: GradOverrides,
): GradFigures {
  const tuitionPerHourOfStanding = student.isAbd
    ? inputs.tuitionPerHourAbd
    : inputs.tuitionPerHourRegular;

  return {
    hourlyRate: overrides.hourlyRate ?? inputs.hourlyRate,
    hours: overrides.hours ?? hoursOfLevels,
    healthRate: overrides.healthRate ?? inputs.healthRate,
    tuitionPerHour: overrides.tuitionPerHour ?? tuitionPerHourOfStanding,
    feeOffset: overrides.feeOffset ?? inputs.feeOffset,
    internationalOffset:
      overrides.internationalOffset ?? inputs.internationalOffset,
    perCreditPayment: overrides.perCreditPayment ?? inputs.perCreditPayment,
    creditsTaught: overrides.creditsTaught ?? student.creditsTaught,
  };
}

/**
 * Null when the term has no grad inputs or no appointment
 * levels. An override of the fee or international offset is
 * the full offset, so the appointment's share still applies.
 */
export function gradCostOf(
  term: GradTerm | null,
  student: GradStudent,
  overrides: GradOverrides = {},
): GradCost | null {
  if (term === null) return null;

  const hoursOfLevels = hoursOfAppointment(
    term.hoursByAppointmentPercent,
    student.appointmentPercent,
  );
  if (hoursOfLevels === undefined) return null;

  const figures = figuresOf(term.inputs, student, hoursOfLevels, overrides);
  const share = offsetShareOf(student.appointmentPercent);
  const base = figures.hourlyRate * figures.hours;
  const feeOffset =
    student.hasFeeOffset && !student.isAbd ? figures.feeOffset * share : 0;
  const internationalOffset = student.isInternational
    ? figures.internationalOffset * share
    : 0;
  const instructorPay = figures.creditsTaught * figures.perCreditPayment;
  const pay = base + feeOffset + internationalOffset + instructorPay;
  const health = figures.healthRate * pay;
  const tuition = figures.tuitionPerHour * figures.hours;
  const fringe = health + tuition;

  return {
    figures,
    figuresWithoutOverrides: figuresOf(term.inputs, student, hoursOfLevels, {}),
    offsetShare: share,
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
