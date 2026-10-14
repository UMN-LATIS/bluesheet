import type {
  CostAssumptions,
  GradOverrideField,
  GradPerson,
  GradRateInputs,
} from "@/types";

export type RateField = "salary" | "fringeRate";

export type RateIdentity =
  | { kind: "jobCode"; jobCode: string; field: RateField }
  | { kind: "person"; emplid: number };

/** A null amount restores the rate beneath it. */
export interface RateOverrideEdit {
  rate: RateIdentity;
  amount: number | null;
}

export interface JobCodeRateOverrideFields {
  salary: number | null;
  fringeRate: number | null;
}

/**
 * A null value restores the admin's value for the term, or
 * for the default appointment, the standard one.
 */
export interface GradInputEdit {
  field: GradOverrideField;
  value: number | null;
}

/** Null hours restores the admin's hours for the appointment. */
export interface GradHoursEdit {
  appointmentPercent: number;
  hours: number | null;
}

/** All of a person's settings, so a checkbox edit carries the appointment too. */
export type GradPersonEdit = GradPerson;

export interface RateOverrides {
  jobCodeRates: Map<string, JobCodeRateOverrideFields>;
  salaryByEmplid: Map<number, number>;
  gradInputs: Partial<GradRateInputs>;
  /** The department's choice. Null when it made none; see `defaultAppointmentOf`. */
  defaultAppointmentPercent: number | null;
  gradHoursByPercent: Map<number, number>;
  /** Only people with a setting: an absent person has the defaults. */
  gradPeopleByEmplid: Map<number, GradPerson>;
}

export interface CostEdits {
  rateOverrideEdits: Record<string, RateOverrideEdit>;
  gradInputEdits: Record<string, GradInputEdit>;
  gradHoursEdits: Record<string, GradHoursEdit>;
  gradPersonEdits: Record<string, GradPersonEdit>;
}

export const gradInputKeyOf = (field: GradInputEdit["field"]) => field;

export const gradHoursKeyOf = (appointmentPercent: number) =>
  String(appointmentPercent);

export const gradPersonKeyOf = (emplid: number) => String(emplid);

export const isDefaultGradPerson = ({
  hasFeeOffset,
  isInternational,
}: GradPerson) => !hasFeeOffset && !isInternational;

export function rateOverrideKeyOf(rate: RateIdentity): string {
  switch (rate.kind) {
    case "jobCode":
      return `jobCode|${rate.jobCode}|${rate.field}`;
    case "person":
      return `person|${rate.emplid}`;
  }
}

function withJobCodeField(
  jobCodeRates: Map<string, JobCodeRateOverrideFields>,
  jobCode: string,
  field: RateField,
  amount: number | null,
): void {
  const fields = {
    ...(jobCodeRates.get(jobCode) ?? { salary: null, fringeRate: null }),
    [field]: amount,
  };

  if (fields.salary === null && fields.fringeRate === null) {
    jobCodeRates.delete(jobCode);
  } else {
    jobCodeRates.set(jobCode, fields);
  }
}

function gradOverridesOf(
  saved: CostAssumptions["rateOverrides"]["grad"],
  edits: GradInputEdit[],
): Partial<Record<GradOverrideField, number>> {
  const inputs = new Map<GradOverrideField, number>();
  const savedEntries = Object.entries(saved ?? {}) as [
    GradOverrideField,
    number | null,
  ][];

  for (const [field, value] of savedEntries) {
    if (value !== null) inputs.set(field, value);
  }
  for (const { field, value } of edits) {
    if (value === null) inputs.delete(field);
    else inputs.set(field, value);
  }

  return Object.fromEntries(inputs);
}

export function rateOverridesOf(
  assumptions: Pick<CostAssumptions, "rateOverrides" | "gradPeople">,
  edits: CostEdits,
): RateOverrides {
  const { jobCodes, people, grad, gradHours } = assumptions.rateOverrides;
  const jobCodeRates = new Map(
    jobCodes.map(({ jobCode, salary, fringeRate }) => [
      jobCode,
      { salary, fringeRate },
    ]),
  );
  const salaryByEmplid = new Map(
    people.map(({ emplid, salary }) => [emplid, salary]),
  );

  for (const { rate, amount } of Object.values(edits.rateOverrideEdits)) {
    switch (rate.kind) {
      case "jobCode":
        withJobCodeField(jobCodeRates, rate.jobCode, rate.field, amount);
        break;
      case "person":
        if (amount === null) salaryByEmplid.delete(rate.emplid);
        else salaryByEmplid.set(rate.emplid, amount);
        break;
    }
  }

  const gradHoursByPercent = new Map(
    gradHours.map(({ appointmentPercent, hours }) => [
      appointmentPercent,
      hours,
    ]),
  );
  for (const { appointmentPercent, hours } of Object.values(
    edits.gradHoursEdits,
  )) {
    if (hours === null) gradHoursByPercent.delete(appointmentPercent);
    else gradHoursByPercent.set(appointmentPercent, hours);
  }

  const gradPeopleByEmplid = new Map(
    assumptions.gradPeople.map((person) => [person.emplid, person]),
  );
  for (const person of Object.values(edits.gradPersonEdits)) {
    if (isDefaultGradPerson(person)) gradPeopleByEmplid.delete(person.emplid);
    else gradPeopleByEmplid.set(person.emplid, person);
  }

  const { defaultAppointmentPercent, ...gradInputs } = gradOverridesOf(
    grad,
    Object.values(edits.gradInputEdits),
  );

  return {
    jobCodeRates,
    salaryByEmplid,
    gradInputs,
    defaultAppointmentPercent: defaultAppointmentPercent ?? null,
    gradHoursByPercent,
    gradPeopleByEmplid,
  };
}
