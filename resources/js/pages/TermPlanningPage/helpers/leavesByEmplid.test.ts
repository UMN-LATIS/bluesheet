import { describe, expect, it } from "vitest";
import { leavesByEmplid } from "./leavesByEmplid";
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
  description: "",
  ...overrides,
});

describe("leavesByEmplid", () => {
  it("gathers both of one person's leaves under their emplid", () => {
    const sabbatical = leave({ id: 1, type: "sabbatical" });
    const release = leave({ id: 2, type: "course_release" });

    const byEmplid = leavesByEmplid([sabbatical, release]);

    expect(byEmplid.get(2019477)).toEqual([sabbatical, release]);
  });

  it("keeps two people apart", () => {
    const byEmplid = leavesByEmplid([
      leave({ id: 1, emplid: 111 }),
      leave({ id: 2, emplid: 222 }),
    ]);

    expect([...byEmplid.keys()]).toEqual([111, 222]);
  });

  it("leaves out a leave with no emplid", () => {
    const byEmplid = leavesByEmplid([leave({ emplid: null })]);

    expect(byEmplid.size).toBe(0);
  });
});
