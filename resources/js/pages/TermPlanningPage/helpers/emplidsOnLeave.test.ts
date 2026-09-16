import { describe, expect, it } from "vitest";
import { emplidsOnLeave } from "./emplidsOnLeave";
import type { TermLeave } from "@/types";

const leave = (overrides: Partial<TermLeave>): TermLeave => ({
  id: 1,
  userId: 10,
  emplid: 2019477,
  name: "Ana García",
  lastName: "García",
  type: "sabbatical",
  status: "confirmed",
  startDate: "2026-09-01",
  endDate: "2026-12-31",
  ...overrides,
});

describe("emplidsOnLeave", () => {
  it("counts one person with two leaves once", () => {
    const emplids = emplidsOnLeave([
      leave({ id: 1, type: "sabbatical" }),
      leave({ id: 2, type: "course_release" }),
    ]);

    expect([...emplids]).toEqual([2019477]);
  });

  it("keeps two people apart", () => {
    const emplids = emplidsOnLeave([
      leave({ id: 1, emplid: 111 }),
      leave({ id: 2, emplid: 222 }),
    ]);

    expect([...emplids]).toEqual([111, 222]);
  });

  it("leaves out a leave with no emplid", () => {
    const emplids = emplidsOnLeave([leave({ emplid: null })]);

    expect(emplids.size).toBe(0);
  });
});
