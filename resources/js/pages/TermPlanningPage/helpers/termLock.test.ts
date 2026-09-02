import { describe, expect, it } from "vitest";
import { lockOfTerm } from "./termLock";
import type { SisTerm } from "../types";

const term = (over: Partial<SisTerm> = {}): SisTerm => ({
  id: 1269,
  name: "Fall 2026",
  startDate: "2026-09-08",
  endDate: "2026-12-16",
  ...over,
});

describe("lockOfTerm", () => {
  it("names a term that has ended as closed", () => {
    expect(lockOfTerm(term({ name: "Fall 2025" }), "2027-01-04")).toEqual({
      headline: "Fall 2025 is closed.",
      detail: "Everything here is historical.",
    });
  });

  it("sends a term already under way to the SIS", () => {
    expect(lockOfTerm(term(), "2026-10-01")?.headline).toBe(
      "Fall 2026 is under way.",
    );
  });

  it("counts the last day of a term as under way, not closed", () => {
    expect(lockOfTerm(term(), "2026-12-16")?.headline).toBe(
      "Fall 2026 is under way.",
    );
  });

  it("says editing is not shipped for a term still to come", () => {
    expect(lockOfTerm(term({ name: "Spring 2027" }), "2026-01-01")).toEqual({
      headline: "Editing isn’t switched on yet.",
      detail: "Spring 2027 is view-only for now.",
    });
  });

  it("locks a term whose dates the SIS left empty", () => {
    expect(
      lockOfTerm(term({ startDate: null, endDate: null }), "2026-10-01"),
    ).not.toBeNull();
  });

  it("locks while no term is known", () => {
    expect(lockOfTerm(null, "2026-10-01")?.detail).toBe(
      "This term is view-only for now.",
    );
  });
});
