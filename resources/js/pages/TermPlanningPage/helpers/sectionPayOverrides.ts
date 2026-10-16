import type { CostAssumptions, SectionPayOverrideRecord } from "@/types";

export type SectionPayOverride = Pick<
  SectionPayOverrideRecord,
  "salary" | "fringeRate" | "appointmentPercent"
>;

export type SectionPayField = keyof SectionPayOverride;

interface SectionPerson {
  courseCode: string;
  section: string;
  emplid: number;
}

/** A null value clears the field. */
export interface SectionPayEdit extends SectionPerson {
  field: SectionPayField;
  value: number | null;
}

export const sectionPayKeyOf = ({
  courseCode,
  section,
  emplid,
}: SectionPerson) => `${courseCode}|${section}|${emplid}`;

export const sectionPayEditKeyOf = (edit: SectionPayEdit) =>
  `${sectionPayKeyOf(edit)}:${edit.field}`;

const noSectionPayOverride = (): SectionPayOverride => ({
  salary: null,
  fringeRate: null,
  appointmentPercent: null,
});

/** By `sectionPayKeyOf`. */
export function sectionPayOverridesOf(
  saved: CostAssumptions["sectionPayOverrides"],
  edits: Record<string, SectionPayEdit>,
): Map<string, SectionPayOverride> {
  const overridesByKey = new Map<string, SectionPayOverride>(
    saved.map((record) => [
      sectionPayKeyOf(record),
      {
        salary: record.salary,
        fringeRate: record.fringeRate,
        appointmentPercent: record.appointmentPercent,
      },
    ]),
  );

  for (const edit of Object.values(edits)) {
    const key = sectionPayKeyOf(edit);
    overridesByKey.set(key, {
      ...(overridesByKey.get(key) ?? noSectionPayOverride()),
      [edit.field]: edit.value,
    });
  }

  return overridesByKey;
}
