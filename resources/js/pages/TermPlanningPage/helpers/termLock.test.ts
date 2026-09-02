import { describe, expect, it } from "vitest";
import { isTermReadOnly } from "./termLock";
import type { SisTerm } from "../types";

const term = (over: Partial<SisTerm> = {}): SisTerm => ({
  id: 1269,
  name: "Fall 2026",
  startDate: "2026-09-08",
  endDate: "2026-12-16",
  ...over,
});

describe("isTermReadOnly", () => {
  it("locks a term that has ended", () => {
    expect(isTermReadOnly(term(), "2027-01-04")).toBe(true);
  });

  it("locks a term already under way", () => {
    expect(isTermReadOnly(term(), "2026-10-01")).toBe(true);
  });

  it("counts the last day of a term as under way", () => {
    expect(isTermReadOnly(term(), "2026-12-16")).toBe(true);
  });

  // Until the save endpoints land, which is what CAN_SAVE_A_FUTURE_TERM says.
  it("locks a term still to come", () => {
    expect(isTermReadOnly(term(), "2026-01-01")).toBe(true);
  });

  it("locks a term whose dates the SIS left empty", () => {
    expect(
      isTermReadOnly(term({ startDate: null, endDate: null }), "2026-10-01"),
    ).toBe(true);
  });

  it("locks while no term is known", () => {
    expect(isTermReadOnly(null, "2026-10-01")).toBe(true);
  });
});
