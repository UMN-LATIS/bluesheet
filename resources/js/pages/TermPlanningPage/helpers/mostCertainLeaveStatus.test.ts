import { describe, expect, it } from "vitest";
import { mostCertainLeaveStatus } from "./mostCertainLeaveStatus";
import type { TermLeave } from "@/types";

const leave = (status: TermLeave["status"]): TermLeave => ({
  id: 1,
  userId: 10,
  emplid: 2019477,
  name: "Ana García",
  lastName: "García",
  type: "sabbatical",
  status,
  startDate: "2026-09-01",
  endDate: "2026-12-31",
});

describe("mostCertainLeaveStatus", () => {
  it("prefers a confirmed leave over a pending one", () => {
    expect(mostCertainLeaveStatus([leave("pending"), leave("confirmed")])).toBe(
      "confirmed",
    );
  });

  it("prefers a pending leave over a bare eligibility", () => {
    expect(mostCertainLeaveStatus([leave("eligible"), leave("pending")])).toBe(
      "pending",
    );
  });

  it("reports eligible when that is all the person has", () => {
    expect(mostCertainLeaveStatus([leave("eligible")])).toBe("eligible");
  });

  it("is null when the person has no leave in the term", () => {
    expect(mostCertainLeaveStatus([])).toBeNull();
  });
});
