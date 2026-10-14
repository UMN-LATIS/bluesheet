import { describe, expect, it } from "vitest";
import { FALL_GRAD_INPUTS, FALL_GRAD_LEVELS } from "./costAssumptions.fixture";
import { gradReceiptOf, salaryReceiptOf } from "./costReceipt";
import { gradCostOf, type GradStudent, type GradTerm } from "./gradCost";

const fallTerm: GradTerm = {
  inputs: FALL_GRAD_INPUTS,
  hoursByAppointmentPercent: new Map(
    FALL_GRAD_LEVELS.map(({ appointmentPercent, hours }) => [
      appointmentPercent,
      hours,
    ]),
  ),
};

const receiptOf = (student: GradStudent) => {
  const cost = gradCostOf(fallTerm, student);
  if (cost === null) throw new Error("No grad cost");

  return gradReceiptOf(student, cost).map(({ label, detail, amount }) => ({
    label,
    detail,
    amount: amount === null ? null : Math.round(amount * 100) / 100,
  }));
};

describe("gradReceiptOf", () => {
  it("itemizes a 25% ABD appointment down to the total", () => {
    expect(
      receiptOf({
        appointmentPercent: 25,
        isAbd: true,
        hasFeeOffset: false,
        isInternational: false,
        creditsTaught: 0,
      }),
    ).toEqual([
      { label: "Base pay", detail: "$29.95/hr × 196 hrs", amount: 5870.2 },
      { label: "Pay", detail: null, amount: 5870.2 },
      { label: "Health", detail: "28.9% of pay", amount: 1696.49 },
      {
        label: "Tuition (ABD)",
        detail: "$3.98/hr × 196 hrs",
        amount: 780.08,
      },
      { label: "Fringe", detail: null, amount: 2476.57 },
      { label: "Total", detail: null, amount: 8346.77 },
    ]);
  });

  it("lists only the offsets and instructor pay that apply", () => {
    const labels = receiptOf({
      appointmentPercent: 25,
      isAbd: false,
      hasFeeOffset: true,
      isInternational: false,
      creditsTaught: 3,
    }).map(({ label, detail }) => [label, detail]);

    expect(labels).toContainEqual(["Student fee offset", "$235 × 50%"]);
    expect(labels).toContainEqual(["Grad instructor pay", "3 credits × $250"]);
    expect(labels.map(([label]) => label)).not.toContain(
      "International GA offset",
    );
  });
});

describe("salaryReceiptOf", () => {
  it("multiplies the per-section salary and fringe by the sections", () => {
    expect(
      salaryReceiptOf({
        salaryPerSection: 10000,
        fringePerSection: 3850,
        sectionCount: 2,
        total: 27700,
      }),
    ).toEqual([
      {
        label: "Salary",
        detail: "2 sections × $10,000",
        amount: 20000,
        kind: "item",
      },
      {
        label: "Fringe",
        detail: "2 sections × $3,850",
        amount: 7700,
        kind: "item",
      },
      { label: "Total", detail: null, amount: 27700, kind: "total" },
    ]);
  });

  it("leaves the salary and fringe empty when there is no rate", () => {
    const [salary, fringe] = salaryReceiptOf({
      salaryPerSection: null,
      fringePerSection: null,
      sectionCount: 1,
      total: 0,
    });

    expect([salary.amount, fringe.amount]).toEqual([null, null]);
  });
});
