import { describe, expect, it } from "vitest";
import { currentTerm } from "./currentTerm";
import type { SisTerm } from "../types";

const term = (id: number, startDate: string, endDate: string): SisTerm => ({
  id,
  name: `term ${id}`,
  startDate,
  endDate,
});

const year: SisTerm[] = [
  term(1269, "2026-09-08", "2026-12-23"),
  term(1273, "2027-01-19", "2027-05-10"),
  term(1275, "2027-06-14", "2027-08-06"),
];

describe("currentTerm", () => {
  it("picks the term whose dates contain today", () => {
    expect(currentTerm(year, "2026-10-01")?.id).toBe(1269);
  });

  it("between terms, picks the next one to start", () => {
    expect(currentTerm(year, "2027-01-02")?.id).toBe(1273);
  });

  it("after the last term ends there is nothing to pick", () => {
    expect(currentTerm(year, "2027-09-01")).toBeNull();
  });

  it("ignores terms the SIS gave no dates", () => {
    const undated: SisTerm = {
      id: 9999,
      name: "undated",
      startDate: null,
      endDate: null,
    };

    expect(currentTerm([undated, ...year], "2026-10-01")?.id).toBe(1269);
  });
});
