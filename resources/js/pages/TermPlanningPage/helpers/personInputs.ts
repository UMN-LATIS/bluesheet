import type { CostAssumptions, PersonInputRecord } from "@/types";

export type PersonInputs = Omit<PersonInputRecord, "emplid">;

export type PersonInputField = keyof PersonInputs;

type TextField = "notes" | "releaseSource";

export type PersonNumberField = Exclude<PersonInputField, TextField>;

/** A null or blank value clears the field. */
export type PersonInputEdit =
  | { emplid: number; field: TextField; value: string | null }
  | {
      emplid: number;
      field: PersonNumberField;
      value: number | null;
    };

export const personInputKeyOf = (emplid: number, field: PersonInputField) =>
  `${emplid}:${field}`;

export const noPersonInputs = (): PersonInputs => ({
  notes: null,
  yearStarted: null,
  courseReleases: null,
  releaseSource: null,
  salary: null,
  fringeRate: null,
  hourlyRate: null,
  hours: null,
  healthRate: null,
  tuitionPerHour: null,
  feeOffset: null,
  internationalOffset: null,
  perCreditPayment: null,
  creditsTaught: null,
});

const nullIfBlank = (value: string | number | null) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export function personInputsOf(
  saved: CostAssumptions["personInputs"],
  edits: Record<string, PersonInputEdit>,
): Map<number, PersonInputs> {
  const inputsByEmplid = new Map<number, PersonInputs>(
    saved.map(({ emplid, ...inputs }) => [emplid, inputs]),
  );

  for (const edit of Object.values(edits)) {
    inputsByEmplid.set(edit.emplid, {
      ...(inputsByEmplid.get(edit.emplid) ?? noPersonInputs()),
      [edit.field]: nullIfBlank(edit.value),
    });
  }

  return inputsByEmplid;
}
