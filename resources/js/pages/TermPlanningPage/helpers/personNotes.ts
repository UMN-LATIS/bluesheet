import type { CostAssumptions } from "@/types";

/** Null or blank notes remove the note. */
export interface PersonNoteEdit {
  emplid: number;
  notes: string | null;
}

export function personNotesOf(
  saved: CostAssumptions["personNotes"],
  edits: Record<string, PersonNoteEdit>,
): Map<number, string> {
  const notesByEmplid = new Map(
    saved.map(({ emplid, notes }) => [emplid, notes]),
  );

  for (const { emplid, notes } of Object.values(edits)) {
    if (notes === null || notes.trim() === "") notesByEmplid.delete(emplid);
    else notesByEmplid.set(emplid, notes);
  }

  return notesByEmplid;
}

export const personNoteKeyOf = (emplid: number) => String(emplid);
