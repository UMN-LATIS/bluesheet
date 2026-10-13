import type { InstructorType, Season, StudentStatus } from "@/types";
import { fiscalYearLabel } from "./fiscalYear";
import { formatWholeDollars } from "./money";

export type CostBasis =
  | {
      kind: "lineOverride";
      reason: string | null;
      /** Null when the replaced line had no rate. */
      replacedAmount: number | null;
    }
  | { kind: "freeComponent"; component: string }
  | { kind: "paidOnLecture"; component: string; lectureSectionId: number }
  | {
      kind: "jobCodeRate";
      jobCode: string;
      /** Null when Nova does not list the job code. */
      title: string | null;
      /** Null when the term's override is the rate. */
      rateFiscalYear: number | null;
      jobCodeCount: number;
    }
  | { kind: "unratedJobCode"; jobCode: string | null }
  | { kind: "unstaffedSection" }
  | {
      kind: "taAppointment";
      appointmentPercent: number;
      season: Season;
      studentStatus: StudentStatus;
      /** Null when the term's override is the rate. */
      rateFiscalYear: number | null;
    }
  | {
      kind: "noTaRate";
      appointmentPercent: number;
      season: Season;
      studentStatus: StudentStatus;
    }
  | { kind: "chargedOnOtherSection"; sectionId: number };

export const INSTRUCTOR_TYPE_LABELS: Record<InstructorType, string> = {
  recurring_budget_faculty: "Recurring budget faculty",
  recurring_budget_pa: "Recurring budget P&A",
  contract_visiting: "Contract / visiting",
  pa_instructor: "P&A instructor",
  graduate_instructor: "Graduate instructor",
  teaching_assistant: "Teaching assistant",
};

const COMPONENT_LABELS: Record<string, string> = {
  IND: "Independent study",
  FWK: "Fieldwork",
  LAB: "Lab",
  DIS: "Discussion",
};

const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  regular: "regular",
  abd: "ABD",
};

/**
 * One line a planner can check by hand, such as
 * "9754 Teaching Specialist · FY27 rate".
 */
export function describeCostBasis(
  basis: CostBasis,
  labelOfSection: (sectionId: number) => string,
): string {
  switch (basis.kind) {
    case "lineOverride": {
      const replacedAmountLabel =
        basis.replacedAmount === null
          ? "no rate"
          : formatWholeDollars(basis.replacedAmount);
      const overrideSummary = `Changed for this section, was ${replacedAmountLabel}`;
      return basis.reason
        ? `${overrideSummary} · ${basis.reason}`
        : overrideSummary;
    }

    case "freeComponent":
      return `${COMPONENT_LABELS[basis.component] ?? basis.component} · no added cost`;

    case "paidOnLecture":
      return `${COMPONENT_LABELS[basis.component] ?? basis.component} in a course with a lecture · paid on ${labelOfSection(basis.lectureSectionId)}`;

    case "jobCodeRate": {
      const jobCodeLabel = basis.title
        ? `${basis.jobCode} ${basis.title}`
        : basis.jobCode;
      const rateLabel = `${jobCodeLabel} · ${rateYearLabel(basis.rateFiscalYear)}`;

      return basis.jobCodeCount > 1
        ? `${rateLabel} · highest of ${basis.jobCodeCount} job codes`
        : rateLabel;
    }

    case "unratedJobCode":
      return basis.jobCode
        ? `${basis.jobCode} has no rate · Unstaffed rate`
        : "No job code in this department · Unstaffed rate";

    case "unstaffedSection":
      return "No instructor yet · Unstaffed rate";

    case "taAppointment": {
      const appointment = `${basis.appointmentPercent}% ${STUDENT_STATUS_LABELS[basis.studentStatus]} TA, ${basis.season}`;
      return `${appointment} · ${rateYearLabel(basis.rateFiscalYear)}`;
    }

    case "noTaRate":
      return `No ${basis.appointmentPercent}% ${STUDENT_STATUS_LABELS[basis.studentStatus]} ${basis.season} TA rate entered`;

    case "chargedOnOtherSection":
      return `Counted on ${labelOfSection(basis.sectionId)}`;
  }
}

const rateYearLabel = (rateFiscalYear: number | null) =>
  rateFiscalYear === null
    ? "rate changed for this term"
    : `${fiscalYearLabel(rateFiscalYear)} rate`;
