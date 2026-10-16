import type { CostAssumptions, GradPerson } from "@/types";
import {
  personInputsOf,
  type PersonInputEdit,
  type PersonInputs,
} from "./personInputs";

/** All of a person's settings, so a checkbox edit carries the appointment too. */
export type GradPersonEdit = GradPerson;

export interface RateOverrides {
  /** Saved inputs with the pending edits on top, for anyone with a record. */
  costInputsByEmplid: Map<number, PersonInputs>;
  /** Only people with a setting: an absent person has the defaults. */
  gradPeopleByEmplid: Map<number, GradPerson>;
}

export interface CostEdits {
  personInputEdits: Record<string, PersonInputEdit>;
  gradPersonEdits: Record<string, GradPersonEdit>;
}

export const gradPersonKeyOf = (emplid: number) => String(emplid);

export const isDefaultGradPerson = ({
  hasFeeOffset,
  isInternational,
}: GradPerson) => !hasFeeOffset && !isInternational;

export function rateOverridesOf(
  assumptions: Pick<CostAssumptions, "personInputs" | "gradPeople">,
  edits: CostEdits,
): RateOverrides {
  const gradPeopleByEmplid = new Map(
    assumptions.gradPeople.map((person) => [person.emplid, person]),
  );
  for (const person of Object.values(edits.gradPersonEdits)) {
    if (isDefaultGradPerson(person)) gradPeopleByEmplid.delete(person.emplid);
    else gradPeopleByEmplid.set(person.emplid, person);
  }

  return {
    costInputsByEmplid: personInputsOf(
      assumptions.personInputs,
      edits.personInputEdits,
    ),
    gradPeopleByEmplid,
  };
}
