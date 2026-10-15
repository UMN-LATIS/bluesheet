import type { CostAssumptions } from "@/types";

export type PersonInputField =
  | "notes"
  | "yearStarted"
  | "courseReleases"
  | "releaseSource"
  | "expectedSections";

/** A null or blank value clears the field. */
export type PersonInputEdit =
  | { emplid: number; field: "notes" | "releaseSource"; value: string | null }
  | {
      emplid: number;
      field: "yearStarted" | "courseReleases" | "expectedSections";
      value: number | null;
    };

export interface PersonInputs {
  notes: string | null;
  yearStarted: number | null;
  courseReleases: number | null;
  releaseSource: string | null;
  expectedSections: number | null;
}

export const personInputKeyOf = (emplid: number, field: PersonInputField) =>
  `${emplid}:${field}`;

const noInputs = (): PersonInputs => ({
  notes: null,
  yearStarted: null,
  courseReleases: null,
  releaseSource: null,
  expectedSections: null,
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
      ...(inputsByEmplid.get(edit.emplid) ?? noInputs()),
      [edit.field]: nullIfBlank(edit.value),
    });
  }

  return inputsByEmplid;
}
