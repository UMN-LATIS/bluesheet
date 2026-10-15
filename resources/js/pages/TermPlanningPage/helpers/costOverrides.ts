import type { CostAssumptions, GradPerson } from "@/types";

/** A null amount restores the job code's rate. */
export interface PersonSalaryEdit {
  emplid: number;
  amount: number | null;
}

/** All of a person's settings, so a checkbox edit carries the appointment too. */
export type GradPersonEdit = GradPerson;

export interface RateOverrides {
  salaryByEmplid: Map<number, number>;
  /** Only people with a setting: an absent person has the defaults. */
  gradPeopleByEmplid: Map<number, GradPerson>;
}

export interface CostEdits {
  personSalaryEdits: Record<string, PersonSalaryEdit>;
  gradPersonEdits: Record<string, GradPersonEdit>;
}

export const personSalaryKeyOf = (emplid: number) => String(emplid);

export const gradPersonKeyOf = (emplid: number) => String(emplid);

export const isDefaultGradPerson = ({
  hasFeeOffset,
  isInternational,
}: GradPerson) => !hasFeeOffset && !isInternational;

export function rateOverridesOf(
  assumptions: Pick<CostAssumptions, "rateOverrides" | "gradPeople">,
  edits: CostEdits,
): RateOverrides {
  const salaryByEmplid = new Map(
    assumptions.rateOverrides.people.map(({ emplid, salary }) => [
      emplid,
      salary,
    ]),
  );
  for (const { emplid, amount } of Object.values(edits.personSalaryEdits)) {
    if (amount === null) salaryByEmplid.delete(emplid);
    else salaryByEmplid.set(emplid, amount);
  }

  const gradPeopleByEmplid = new Map(
    assumptions.gradPeople.map((person) => [person.emplid, person]),
  );
  for (const person of Object.values(edits.gradPersonEdits)) {
    if (isDefaultGradPerson(person)) gradPeopleByEmplid.delete(person.emplid);
    else gradPeopleByEmplid.set(person.emplid, person);
  }

  return { salaryByEmplid, gradPeopleByEmplid };
}
