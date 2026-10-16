import type { GradCost, GradFigureField, GradStudent } from "./gradCost";
import { countLabel } from "./countLabel";
import { formatDollars } from "./money";
import type { PersonNumberField } from "./personInputs";
import { formatPercent } from "./percentAmounts";

export type ReceiptField = Exclude<
  PersonNumberField,
  "yearStarted" | "courseReleases"
>;

export const RECEIPT_FIELD_LABELS: Record<ReceiptField, string> = {
  salary: "Salary per section",
  fringeRate: "Fringe rate",
  hourlyRate: "Hourly rate",
  hours: "Hours",
  healthRate: "Health rate",
  tuitionPerHour: "Tuition per hour",
  feeOffset: "Student fee offset",
  internationalOffset: "International GA offset",
  perCreditPayment: "Pay per credit",
  creditsTaught: "Credits taught",
};

export type ReceiptInputKind = "dollars" | "percent" | "hours" | "count";

export interface ReceiptInput {
  field: ReceiptField;
  /** Null when no rate exists. */
  value: number | null;
  valueWithoutOverride: number | null;
  isOverridden: boolean;
  kind: ReceiptInputKind;
}

export type ReceiptPart = string | ReceiptInput;

export interface ReceiptLine {
  label: string;
  parts: ReceiptPart[];
  amount: number | null;
  kind: "item" | "subtotal" | "total";
}

export function formatReceiptValue(
  kind: ReceiptInputKind,
  value: number | null,
): string {
  if (value === null) return "No rate";

  switch (kind) {
    case "dollars":
      return formatDollars(value);
    case "percent":
      return formatPercent(value);
    case "hours":
    case "count":
      return String(value);
  }
}

function receiptPartOf(input: ReceiptInput, isEditable: boolean): ReceiptPart {
  return isEditable ? input : formatReceiptValue(input.kind, input.value);
}

export function gradReceiptOf(
  student: GradStudent,
  cost: GradCost,
  isEditable: boolean,
): ReceiptLine[] {
  const { figures, figuresWithoutOverrides, offsetShare } = cost;
  const input = (field: GradFigureField, kind: ReceiptInputKind) =>
    receiptPartOf(
      {
        field,
        value: figures[field],
        valueWithoutOverride: figuresWithoutOverrides[field],
        isOverridden: figures[field] !== figuresWithoutOverrides[field],
        kind,
      },
      isEditable,
    );
  const sharePart = ` × ${formatPercent(offsetShare)}`;
  const isPayingCredits =
    figures.creditsTaught > 0 ||
    figures.creditsTaught !== figuresWithoutOverrides.creditsTaught;
  const creditsPart = ` ${figures.creditsTaught === 1 ? "credit" : "credits"} × `;

  const lines = [
    item(
      "Base pay",
      [
        input("hourlyRate", "dollars"),
        "/hr × ",
        input("hours", "hours"),
        " hrs",
      ],
      cost.base,
    ),
  ];
  if (student.hasFeeOffset && !student.isAbd) {
    lines.push(
      item(
        "Student fee offset",
        [input("feeOffset", "dollars"), sharePart],
        cost.feeOffset,
      ),
    );
  }
  if (student.isInternational) {
    lines.push(
      item(
        "International GA offset",
        [input("internationalOffset", "dollars"), sharePart],
        cost.internationalOffset,
      ),
    );
  }
  if (isPayingCredits) {
    lines.push(
      item(
        "Grad instructor pay",
        [
          input("creditsTaught", "count"),
          creditsPart,
          input("perCreditPayment", "dollars"),
        ],
        cost.instructorPay,
      ),
    );
  }
  lines.push(
    subtotal("Pay", cost.pay),
    item("Health", [input("healthRate", "percent"), " of pay"], cost.health),
    item(
      student.isAbd ? "Tuition (ABD)" : "Tuition",
      [input("tuitionPerHour", "dollars"), `/hr × ${figures.hours} hrs`],
      cost.tuition,
    ),
    subtotal("Fringe", cost.fringe),
    { label: "Total", parts: [], amount: cost.total, kind: "total" },
  );

  return lines;
}

export interface ReceiptFigure {
  value: number | null;
  valueWithoutOverride: number | null;
}

export interface TaWork {
  salary: ReceiptFigure;
  fringeRate: ReceiptFigure;
  courseCount: number;
}

function taReceiptLinesOf({ salary, fringeRate, courseCount }: TaWork): {
  salaryLine: ReceiptLine;
  fringeLine: ReceiptLine;
} {
  const salaryAmount =
    salary.value === null ? null : salary.value * courseCount;
  const fringeAmount =
    salaryAmount === null || fringeRate.value === null
      ? null
      : salaryAmount * fringeRate.value;
  const coursesPart = `${countLabel(courseCount, "course", "courses")} × `;

  return {
    salaryLine: item(
      "TA salary",
      [coursesPart, formatReceiptValue("dollars", salary.value)],
      salaryAmount,
    ),
    fringeLine: item(
      "TA fringe",
      [formatReceiptValue("percent", fringeRate.value), " of TA salary"],
      fringeAmount,
    ),
  };
}

export function salaryReceiptOf({
  salary,
  fringeRate,
  sectionCount,
  total,
  isEditable,
  taWork,
}: {
  salary: ReceiptFigure;
  fringeRate: ReceiptFigure;
  sectionCount: number;
  total: number;
  isEditable: boolean;
  taWork?: TaWork;
}): ReceiptLine[] {
  const input = (
    field: ReceiptField,
    figure: ReceiptFigure,
    kind: ReceiptInputKind,
  ) =>
    receiptPartOf(
      {
        field,
        ...figure,
        isOverridden: figure.value !== figure.valueWithoutOverride,
        kind,
      },
      isEditable,
    );
  const hasNothingToShow = salary.value === null && !isEditable;
  const sectionsPart = `${countLabel(sectionCount, "section", "sections")} × `;
  const salaryAmount =
    salary.value === null ? null : salary.value * sectionCount;
  const fringeAmount =
    salaryAmount === null || fringeRate.value === null
      ? null
      : salaryAmount * fringeRate.value;

  const taLines = taWork ? taReceiptLinesOf(taWork) : undefined;

  return [
    item(
      "Salary",
      hasNothingToShow
        ? []
        : [sectionsPart, input("salary", salary, "dollars")],
      salaryAmount,
    ),
    ...(taLines ? [taLines.salaryLine] : []),
    item(
      "Fringe",
      hasNothingToShow
        ? []
        : [input("fringeRate", fringeRate, "percent"), " of salary"],
      fringeAmount,
    ),
    ...(taLines ? [taLines.fringeLine] : []),
    { label: "Total", parts: [], amount: total, kind: "total" },
  ];
}

const item = (
  label: string,
  parts: ReceiptPart[],
  amount: number | null,
): ReceiptLine => ({ label, parts, amount, kind: "item" });

const subtotal = (label: string, amount: number): ReceiptLine => ({
  label,
  parts: [],
  amount,
  kind: "subtotal",
});
