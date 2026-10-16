import { describe, expect, it } from "vitest";
import { instructorCostGroupsOf } from "./instructorCostRows";
import { personRow, unstaffedRow } from "./personRow.fixture";

const grad = personRow({
  emplid: 10,
  name: "Grad, Gia",
  instructorType: "teaching_assistant",
  isGrad: true,
  salary: 4000,
  fringe: 900,
  appointmentPercent: 50,
  loadLabel: "50%",
  total: 4900,
});

describe("instructorCostGroupsOf", () => {
  it("groups non-grad people with Unstaffed last, and grads apart", () => {
    const { groups } = instructorCostGroupsOf([
      personRow({ emplid: 1 }),
      grad,
      personRow({ emplid: 2, instructorType: "pa_instructor" }),
      unstaffedRow(),
    ]);

    expect(
      groups.map(({ label, rows }) => [
        label,
        rows.map(({ emplid }) => emplid),
      ]),
    ).toEqual([
      ["Faculty and P&A", [1, 2, null]],
      ["Grad assistants", [10]],
    ]);
  });

  it("skips people on no section and drops an empty group", () => {
    const { groups } = instructorCostGroupsOf([
      personRow({ emplid: 1, isAssigned: false }),
      grad,
    ]);

    expect(groups.map(({ label }) => label)).toEqual(["Grad assistants"]);
  });

  it("labels types, including a missing job code and Unstaffed", () => {
    const { groups } = instructorCostGroupsOf([
      personRow({ emplid: 1 }),
      personRow({ emplid: 2, instructorType: null }),
      unstaffedRow(),
      grad,
    ]);

    expect(
      groups.flatMap(({ rows }) => rows.map(({ typeLabel }) => typeLabel)),
    ).toEqual([
      "Recurring budget faculty",
      "No job code",
      "Unstaffed",
      "TA support",
    ]);
  });

  it("prices a section at salary plus fringe, marks an overridden rate, and shows a grad's appointment instead", () => {
    const { groups } = instructorCostGroupsOf([
      personRow({ emplid: 1, salary: 6000, fringe: 3000 }),
      personRow({ emplid: 2, salary: 8000, fringe: 0, isRateOverridden: true }),
      personRow({ emplid: 3, salary: null, fringe: null }),
      grad,
    ]);

    expect(
      groups.flatMap(({ rows }) =>
        rows.map(({ ratePerSection }) => ratePerSection),
      ),
    ).toEqual([
      { kind: "amount", dollars: 9000, isOverridden: false },
      { kind: "amount", dollars: 8000, isOverridden: true },
      { kind: "missingRate" },
      { kind: "appointment", percentLabel: "50%" },
    ]);
  });

  it("totals the term cost of every listed row", () => {
    const { totalCost } = instructorCostGroupsOf([
      personRow({ emplid: 1, total: 100 }),
      personRow({ emplid: 2, total: 50, isAssigned: false }),
      grad,
    ]);

    expect(totalCost).toBe(5000);
  });
});
