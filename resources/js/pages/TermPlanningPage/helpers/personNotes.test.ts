import { describe, expect, it } from "vitest";
import { personNotesOf } from "./personNotes";

const saved = [{ emplid: 1, notes: "On sabbatical in spring" }];

describe("personNotesOf", () => {
  it("keeps the saved notes when nothing is pending", () => {
    expect(personNotesOf(saved, {}).get(1)).toBe("On sabbatical in spring");
  });

  it("shows a pending edit over the saved note", () => {
    const notes = personNotesOf(saved, { "1": { emplid: 1, notes: "Back" } });

    expect(notes.get(1)).toBe("Back");
  });

  it("removes the note when the pending edit is blank or null", () => {
    expect(
      personNotesOf(saved, { "1": { emplid: 1, notes: "  " } }).has(1),
    ).toBe(false);
    expect(
      personNotesOf(saved, { "1": { emplid: 1, notes: null } }).has(1),
    ).toBe(false);
  });
});
