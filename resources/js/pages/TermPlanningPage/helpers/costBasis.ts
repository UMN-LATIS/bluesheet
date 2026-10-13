import type { InstructorType, Season, StudentStatus } from "@/types";
import { fiscalYearLabel } from "./fiscalYear";

export type CostBasis =
  | { kind: "override"; reason: string | null }
  | { kind: "recurringBudget"; instructorType: InstructorType }
  | { kind: "freeComponent"; component: string }
  | { kind: "paidOnLecture"; component: string }
  | {
      kind: "jobCodeRate";
      jobCode: string;
      title: string;
      rateFiscalYear: number;
      chosenBy: "planner" | "highestRate";
      jobCodeCount: number;
    }
  | { kind: "unratedJobCode"; jobCode: string | null }
  | { kind: "unstaffedSection" }
  | {
      kind: "taAppointment";
      appointmentPercent: number;
      season: Season;
      studentStatus: StudentStatus;
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
};

const PAID_ON_LECTURE_LABELS: Record<string, string> = {
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
    case "override":
      return basis.reason ? `Override: ${basis.reason}` : "Override";

    case "recurringBudget":
      return `${INSTRUCTOR_TYPE_LABELS[basis.instructorType]} · no added cost`;

    case "freeComponent":
      return `${COMPONENT_LABELS[basis.component] ?? basis.component} · no added cost`;

    case "paidOnLecture":
      return `${PAID_ON_LECTURE_LABELS[basis.component] ?? basis.component} in a course with a lecture · paid on the lecture`;

    case "jobCodeRate": {
      const rate = `${basis.jobCode} ${basis.title} · ${fiscalYearLabel(basis.rateFiscalYear)} rate`;
      const isHighestOfSeveral =
        basis.chosenBy === "highestRate" && basis.jobCodeCount > 1;

      return isHighestOfSeveral
        ? `${rate} · highest of ${basis.jobCodeCount} job codes`
        : rate;
    }

    case "unratedJobCode":
      return basis.jobCode
        ? `${basis.jobCode} has no rate · unrated job code cost`
        : "No job code in this department · unrated job code cost";

    case "unstaffedSection":
      return "No instructor yet · unstaffed section cost";

    case "taAppointment": {
      const appointment = `${basis.appointmentPercent}% ${STUDENT_STATUS_LABELS[basis.studentStatus]} TA, ${basis.season}`;
      return basis.rateFiscalYear === null
        ? appointment
        : `${appointment} · ${fiscalYearLabel(basis.rateFiscalYear)} rate`;
    }

    case "noTaRate":
      return `No ${basis.appointmentPercent}% ${STUDENT_STATUS_LABELS[basis.studentStatus]} ${basis.season} TA rate entered`;

    case "chargedOnOtherSection":
      return `Counted on ${labelOfSection(basis.sectionId)}`;
  }
}
