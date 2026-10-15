import { describe, expect, it } from "vitest";
import { paContractRowsOf } from "./paContractRows";
import { personRow, unstaffedRow } from "./personRow.fixture";

describe("paContractRowsOf", () => {
  it("keeps P&A, contract, and no-job-code people, and labels their type", () => {
    const { rows } = paContractRowsOf([
      personRow({ emplid: 1, instructorType: "pa_instructor" }),
      personRow({ emplid: 2, instructorType: "contract_visiting" }),
      personRow({ emplid: 3, instructorType: "recurring_budget_pa" }),
      personRow({ emplid: 4, instructorType: null }),
      personRow({ emplid: 5 }),
      personRow({
        emplid: 6,
        instructorType: "teaching_assistant",
        isGrad: true,
      }),
      personRow({ emplid: 7, instructorType: null, isGrad: true }),
      unstaffedRow(),
    ]);

    expect(rows.map(({ emplid, typeLabel }) => [emplid, typeLabel])).toEqual([
      [1, "P&A instructor"],
      [2, "Contract/Visiting"],
      [3, "Recurring P&A"],
      [4, "No job code"],
    ]);
  });

  it("flags a listed count that differs from the expected count", () => {
    const { rows } = paContractRowsOf([
      personRow({
        emplid: 1,
        instructorType: "pa_instructor",
        paidSectionCount: 1,
        expectedSectionCount: 3,
      }),
      personRow({
        emplid: 2,
        instructorType: "pa_instructor",
        paidSectionCount: 3,
        expectedSectionCount: 2,
      }),
      personRow({
        emplid: 3,
        instructorType: "pa_instructor",
        paidSectionCount: 2,
        expectedSectionCount: 2,
      }),
    ]);

    expect(rows.map(({ mismatchLabel }) => mismatchLabel)).toEqual([
      "2 short",
      "1 over",
      null,
    ]);
  });

  it("totals people, expected and listed sections, and cost", () => {
    const { totals } = paContractRowsOf([
      personRow({
        emplid: 1,
        instructorType: "pa_instructor",
        paidSectionCount: 1,
        expectedSectionCount: 2,
        total: 5000,
      }),
      personRow({
        emplid: 2,
        instructorType: null,
        paidSectionCount: 2,
        total: 7000,
      }),
    ]);

    expect(totals).toEqual({ count: 2, expected: 2, listed: 3, cost: 12000 });
  });
});
