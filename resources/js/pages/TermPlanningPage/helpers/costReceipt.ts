import type { GradCost, GradStudent } from "./gradCost";
import { formatDollars } from "./money";
import { formatPercent } from "./percentAmounts";

export interface ReceiptLine {
  label: string;
  detail: string | null;
  amount: number | null;
  kind: "item" | "subtotal" | "total";
}

export function gradReceiptOf(
  student: GradStudent,
  cost: GradCost,
): ReceiptLine[] {
  const { inputs, offsetShare, hours } = cost;
  const perHour = (rate: number) => `${formatDollars(rate)}/hr × ${hours} hrs`;
  const shareOf = (fullOffset: number) =>
    `${formatDollars(fullOffset)} × ${formatPercent(offsetShare)}`;
  const credits = student.creditsTaught;

  return [
    item("Base pay", perHour(inputs.hourlyRate), cost.base),
    ...(cost.feeOffset > 0
      ? [item("Student fee offset", shareOf(inputs.feeOffset), cost.feeOffset)]
      : []),
    ...(cost.internationalOffset > 0
      ? [
          item(
            "International GA offset",
            shareOf(inputs.internationalOffset),
            cost.internationalOffset,
          ),
        ]
      : []),
    ...(cost.instructorPay > 0
      ? [
          item(
            "Grad instructor pay",
            `${credits} ${credits === 1 ? "credit" : "credits"} × ${formatDollars(inputs.perCreditPayment)}`,
            cost.instructorPay,
          ),
        ]
      : []),
    subtotal("Pay", cost.pay),
    item("Health", `${formatPercent(inputs.healthRate)} of pay`, cost.health),
    item(
      student.isAbd ? "Tuition (ABD)" : "Tuition",
      perHour(cost.tuitionPerHour),
      cost.tuition,
    ),
    subtotal("Fringe", cost.fringe),
    { label: "Total", detail: null, amount: cost.total, kind: "total" },
  ];
}

export function salaryReceiptOf({
  salaryPerSection,
  fringePerSection,
  sectionCount,
  total,
}: {
  salaryPerSection: number | null;
  fringePerSection: number | null;
  sectionCount: number;
  total: number;
}): ReceiptLine[] {
  const perSection = (amount: number | null) =>
    amount === null
      ? null
      : `${sectionCount} ${sectionCount === 1 ? "section" : "sections"} × ${formatDollars(amount)}`;
  const timesSections = (amount: number | null) =>
    amount === null ? null : amount * sectionCount;

  return [
    item(
      "Salary",
      perSection(salaryPerSection),
      timesSections(salaryPerSection),
    ),
    item(
      "Fringe",
      perSection(fringePerSection),
      timesSections(fringePerSection),
    ),
    { label: "Total", detail: null, amount: total, kind: "total" },
  ];
}

const item = (
  label: string,
  detail: string | null,
  amount: number | null,
): ReceiptLine => ({ label, detail, amount, kind: "item" });

const subtotal = (label: string, amount: number): ReceiptLine => ({
  label,
  detail: null,
  amount,
  kind: "subtotal",
});
