import type { CostAssumptions, GradPerson } from "@/types";
import {
  personInputsOf,
  type PersonInputEdit,
  type PersonInputs,
} from "./personInputs";
import {
  sectionPayOverridesOf,
  type SectionPayEdit,
  type SectionPayOverride,
} from "./sectionPayOverrides";

export interface CostInputs {
  /**
   * Saved inputs with the pending edits applied, for anyone
   * with a record.
   */
  personInputsByEmplid: Map<number, PersonInputs>;
  /**
   * Only people with a setting: an absent person has the
   * defaults.
   */
  gradPeopleByEmplid: Map<number, GradPerson>;
  /**
   * Saved overrides with the pending edits applied, by
   * `sectionPayKeyOf`.
   */
  sectionPayOverridesByKey: Map<string, SectionPayOverride>;
}

export interface CostEdits {
  personInputEdits: Record<string, PersonInputEdit>;
  gradPersonEdits: Record<string, GradPerson>;
  sectionPayEdits: Record<string, SectionPayEdit>;
}

export const gradPersonKeyOf = (emplid: number) => String(emplid);

export const isDefaultGradPerson = ({
  hasFeeOffset,
  isInternational,
}: GradPerson) => !hasFeeOffset && !isInternational;

export function costInputsOf(
  assumptions: Pick<
    CostAssumptions,
    "personInputs" | "gradPeople" | "sectionPayOverrides"
  >,
  edits: CostEdits,
): CostInputs {
  const gradPeopleByEmplid = new Map(
    assumptions.gradPeople.map((person) => [person.emplid, person]),
  );
  for (const person of Object.values(edits.gradPersonEdits)) {
    if (isDefaultGradPerson(person)) gradPeopleByEmplid.delete(person.emplid);
    else gradPeopleByEmplid.set(person.emplid, person);
  }

  return {
    personInputsByEmplid: personInputsOf(
      assumptions.personInputs,
      edits.personInputEdits,
    ),
    gradPeopleByEmplid,
    sectionPayOverridesByKey: sectionPayOverridesOf(
      assumptions.sectionPayOverrides,
      edits.sectionPayEdits,
    ),
  };
}
