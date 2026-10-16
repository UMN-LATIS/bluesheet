import { describe, expect, it } from "vitest";
import { FALL_GRAD_INPUTS, FALL_GRAD_LEVELS } from "./costAssumptions.fixture";
import {
  formatReceiptValue,
  gradReceiptOf,
  salaryReceiptOf,
  type ReceiptPart,
} from "./costReceipt";
import {
  gradCostOf,
  type GradOverrides,
  type GradStudent,
  type GradTerm,
} from "./gradCost";

const fallTerm: GradTerm = {
  inputs: FALL_GRAD_INPUTS,
  hoursByAppointmentPercent: new Map(
    FALL_GRAD_LEVELS.map(({ appointmentPercent, hours }) => [
      appointmentPercent,
      hours,
    ]),
  ),
};

const sentenceOf = (parts: ReceiptPart[]) =>
  parts
    .map((part) =>
      typeof part === "string"
        ? part
        : `[${part.field}=${formatReceiptValue(part.kind, part.value)}]`,
    )
    .join("");

const costFor = (student: GradStudent, overrides: GradOverrides = {}) => {
  const cost = gradCostOf(fallTerm, student, overrides);
  if (cost === null) throw new Error("No grad cost");

  return cost;
};

const receiptOf = (student: GradStudent, overrides: GradOverrides = {}) =>
  gradReceiptOf(student, costFor(student, overrides), true).map(
    ({ label, parts, amount }) => ({
      label,
      detail: parts.length === 0 ? null : sentenceOf(parts),
      amount: amount === null ? null : Math.round(amount * 100) / 100,
    }),
  );

const noGradExtras: GradStudent = {
  appointmentPercent: 25,
  isAbd: false,
  hasFeeOffset: false,
  isInternational: false,
  creditsTaught: 0,
};

describe("gradReceiptOf", () => {
  it("itemizes a 25% ABD appointment down to the total", () => {
    expect(receiptOf({ ...noGradExtras, isAbd: true })).toEqual([
      {
        label: "Base pay",
        detail: "[hourlyRate=$29.95]/hr × [hours=196] hrs",
        amount: 5870.2,
      },
      { label: "Pay", detail: null, amount: 5870.2 },
      { label: "Health", detail: "[healthRate=28.9%] of pay", amount: 1696.49 },
      {
        label: "Tuition (ABD)",
        detail: "[tuitionPerHour=$3.98]/hr × 196 hrs",
        amount: 780.08,
      },
      { label: "Fringe", detail: null, amount: 2476.57 },
      { label: "Total", detail: null, amount: 8346.77 },
    ]);
  });

  it("lists only the offsets and instructor pay that apply", () => {
    const labels = receiptOf({
      ...noGradExtras,
      hasFeeOffset: true,
      creditsTaught: 3,
    }).map(({ label, detail }) => [label, detail]);

    expect(labels).toContainEqual([
      "Student fee offset",
      "[feeOffset=$235] × 50%",
    ]);
    expect(labels).toContainEqual([
      "Grad instructor pay",
      "[creditsTaught=3] credits × [perCreditPayment=$250]",
    ]);
    expect(labels.map(([label]) => label)).not.toContain(
      "International GA offset",
    );
  });

  it("keeps the instructor pay line when the credits are overridden to 0", () => {
    const labels = receiptOf(
      { ...noGradExtras, creditsTaught: 3 },
      { creditsTaught: 0 },
    ).map(({ label }) => label);

    expect(labels).toContain("Grad instructor pay");
  });

  it("marks an overridden input and carries the value it replaced", () => {
    const student = { ...noGradExtras, isAbd: true };
    const [basePay] = gradReceiptOf(
      student,
      costFor(student, { hourlyRate: 40 }),
      true,
    );
    const [hourlyRate, , hours] = basePay.parts;

    expect(hourlyRate).toEqual({
      field: "hourlyRate",
      value: 40,
      valueWithoutOverride: 29.95,
      isOverridden: true,
      kind: "dollars",
    });
    expect(hours).toMatchObject({ field: "hours", isOverridden: false });
    expect(basePay.amount).toBe(40 * 196);
  });

  it("shows plain text and no inputs when the row cannot be edited", () => {
    const cost = costFor(noGradExtras);
    const parts = gradReceiptOf(noGradExtras, cost, false).flatMap(
      (line) => line.parts,
    );

    expect(parts.every((part) => typeof part === "string")).toBe(true);
    expect(parts).toContain("$29.95");
  });
});

describe("salaryReceiptOf", () => {
  const rate = (value: number | null, valueWithoutOverride = value) => ({
    value,
    valueWithoutOverride,
  });

  it("multiplies the per-section salary and its fringe by the sections", () => {
    const lines = salaryReceiptOf({
      salary: rate(10000),
      fringeRate: rate(0.385),
      sectionCount: 2,
      total: 27700,
      isEditable: true,
    });

    expect(
      lines.map(({ label, parts, amount }) => [
        label,
        sentenceOf(parts),
        amount,
      ]),
    ).toEqual([
      ["Salary", "2 sections × [salary=$10,000]", 20000],
      ["Fringe", "[fringeRate=38.5%] of salary", 7700],
      ["Total", "", 27700],
    ]);
  });

  it("marks the salary and fringe rate overridden when they differ from the job code's", () => {
    const [salary, fringe] = salaryReceiptOf({
      salary: rate(8000, 6000),
      fringeRate: rate(0.1, 0.5),
      sectionCount: 1,
      total: 8800,
      isEditable: true,
    });

    expect(salary.parts[1]).toMatchObject({
      isOverridden: true,
      valueWithoutOverride: 6000,
    });
    expect(fringe.parts[0]).toMatchObject({
      isOverridden: true,
      valueWithoutOverride: 0.5,
    });
  });

  it("leaves the salary and fringe empty when there is no rate", () => {
    const [salary, fringe] = salaryReceiptOf({
      salary: rate(null),
      fringeRate: rate(0),
      sectionCount: 1,
      total: 0,
      isEditable: true,
    });

    expect([salary.amount, fringe.amount]).toEqual([null, null]);
  });

  it("shows no parts for a row that cannot be edited and has no rate", () => {
    const [salary, fringe] = salaryReceiptOf({
      salary: rate(null),
      fringeRate: rate(0),
      sectionCount: 1,
      total: 0,
      isEditable: false,
    });

    expect([salary.parts, fringe.parts]).toEqual([[], []]);
  });
});
