import type { CostAssumptions } from "@/types";
import type { GradScenario } from "../useScheduleEditor/types";
import {
  defaultAppointmentOf,
  gradCostOf,
  gradTermOf,
  type GradCost,
} from "./gradCost";
import { formatDollarsAndCents } from "./money";
import { formatPercent } from "./percentAmounts";

export interface GradCalculatorInput {
  label: string;
  text: string;
}

export interface GradCalculatorRow {
  appointmentPercent: number;
  hours: number;
  base: number;
  /** Null for ABD, which is ineligible. */
  feeOffset: number | null;
  internationalOffset: number;
  instructorPay: number;
  salary: number;
  health: number;
  tuition: number;
  fringe: number;
  total: number;
}

export interface GradCalculatorGroup {
  label: "Regular" | "ABD";
  rows: GradCalculatorRow[];
}

export interface GradCalculator {
  inputs: GradCalculatorInput[];
  groups: GradCalculatorGroup[];
}

const rowOf = (
  appointmentPercent: number,
  isAbd: boolean,
  cost: GradCost,
): GradCalculatorRow => ({
  appointmentPercent,
  hours: cost.figures.hours,
  base: cost.base,
  feeOffset: isAbd ? null : cost.feeOffset,
  internationalOffset: cost.internationalOffset,
  instructorPay: cost.instructorPay,
  salary: cost.pay,
  health: cost.health,
  tuition: cost.tuition,
  fringe: cost.fringe,
  total: cost.total,
});

/** Null when the term has no grad rates. */
export function gradCalculatorOf(
  assumptions: CostAssumptions,
  scenario: GradScenario,
): GradCalculator | null {
  const term = gradTermOf(assumptions);
  if (term === null) return null;

  const { inputs } = term;
  const appointmentPercents = assumptions.gradRates.levels
    .map(({ appointmentPercent }) => appointmentPercent)
    .sort((a, b) => a - b);

  const groupOf = (
    label: GradCalculatorGroup["label"],
    isAbd: boolean,
  ): GradCalculatorGroup => ({
    label,
    rows: appointmentPercents.flatMap((appointmentPercent) => {
      const cost = gradCostOf(term, {
        appointmentPercent,
        isAbd,
        hasFeeOffset: scenario.hasFeeOffset,
        isInternational: scenario.isInternational,
        creditsTaught: scenario.creditsTaught,
      });

      return cost === null ? [] : [rowOf(appointmentPercent, isAbd, cost)];
    }),
  });

  return {
    inputs: [
      { label: "Hourly rate", text: formatDollarsAndCents(inputs.hourlyRate) },
      { label: "GA health", text: formatPercent(inputs.healthRate) },
      {
        label: "Tuition per hour",
        text: formatDollarsAndCents(inputs.tuitionPerHourRegular),
      },
      {
        label: "ABD tuition per hour",
        text: formatDollarsAndCents(inputs.tuitionPerHourAbd),
      },
      {
        label: "Student fee offset",
        text: formatDollarsAndCents(inputs.feeOffset),
      },
      {
        label: "International offset",
        text: formatDollarsAndCents(inputs.internationalOffset),
      },
      {
        label: "Grad instructor pay per credit",
        text: formatDollarsAndCents(inputs.perCreditPayment),
      },
      {
        label: "Default appointment per section",
        text: `${defaultAppointmentOf(assumptions.gradRates)}%`,
      },
    ],
    groups: [groupOf("Regular", false), groupOf("ABD", true)],
  };
}
