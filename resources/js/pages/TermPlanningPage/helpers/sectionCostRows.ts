import { lastNameFirst } from "@/utils/lastNameFirst";
import type { PlannedSection, SisInstructor } from "../types";
import { notPaidHereReasonOf } from "./costReason";
import { formatWholeDollars } from "./money";
import type { SectionPayField } from "./sectionPayOverrides";
import type { CostLine, SectionCost } from "./termEstimate";

export interface SectionPayInput {
  emplid: number;
  field: SectionPayField;
  value: number | null;
  valueWithoutOverride: number | null;
  isOverridden: boolean;
}

export interface SectionCostRow {
  key: string;
  name: string;
  isTa: boolean;
  amount: number | null;
  unpaidReason: string | null;
  /** Empty on the unstaffed line, which names no one. */
  payInputs: SectionPayInput[];
}

export interface SectionCostDetails {
  rows: SectionCostRow[];
  summary: string;
}

export function sectionCostDetailsOf(
  section: PlannedSection,
  cost: SectionCost,
  labelOfSection: (sectionId: number) => string,
): SectionCostDetails | null {
  if (cost.lines.length === 0) return null;

  return {
    rows: sectionCostRowsOf(section, cost, labelOfSection),
    summary: costSummaryOf(cost),
  };
}

function sectionCostRowsOf(
  section: PlannedSection,
  cost: SectionCost,
  labelOfSection: (sectionId: number) => string,
): SectionCostRow[] {
  return cost.lines.map((line, index) => {
    const { role, emplid, amount, basis } = line;
    const person = section.instructors.find(
      (instructor) => instructor.emplid === emplid,
    );

    return {
      key: `${index}-${emplid}`,
      name: displayNameOf(emplid, person),
      isTa: role === "ta",
      amount,
      unpaidReason: notPaidHereReasonOf(basis, labelOfSection),
      payInputs: payInputsOf(line),
    };
  });
}

function payInputsOf({
  emplid,
  salary,
  sectionAppointment,
  sectionSalary,
}: CostLine): SectionPayInput[] {
  if (emplid === null) return [];

  if (sectionAppointment) {
    return [
      {
        emplid,
        field: "appointmentPercent",
        value: sectionAppointment.percent,
        valueWithoutOverride: sectionAppointment.percentWithoutOverride,
        isOverridden: sectionAppointment.isOverridden,
      },
    ];
  }

  if (!sectionSalary) return [];

  return [
    {
      emplid,
      field: "salary",
      value: salary,
      valueWithoutOverride: sectionSalary.salaryWithoutOverride,
      isOverridden: sectionSalary.isSalaryOverridden,
    },
    {
      emplid,
      field: "fringeRate",
      value: sectionSalary.fringeRate,
      valueWithoutOverride: sectionSalary.fringeRateWithoutOverride,
      isOverridden: sectionSalary.isFringeRateOverridden,
    },
  ];
}

function displayNameOf(
  emplid: number | null,
  person: SisInstructor | undefined,
): string {
  if (emplid === null) return "TBA";
  if (person?.name) return lastNameFirst(person.name, person.lastName);

  return person?.lastName ?? "Unknown";
}

function costSummaryOf(cost: SectionCost): string {
  const hasMissingRate = cost.lines.some(({ amount }) => amount === null);
  return hasMissingRate ? "No rate" : formatWholeDollars(cost.total);
}
