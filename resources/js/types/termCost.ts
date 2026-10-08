import type { SisSectionMeeting } from "@/pages/TermPlanningPage/types";

export type InstructorType =
  | "recurring_budget_faculty"
  | "recurring_budget_pa"
  | "contract_visiting"
  | "pa_instructor"
  | "graduate_instructor"
  | "teaching_assistant";

export type Season = "fall" | "spring" | "summer";

export type StudentStatus = "regular" | "abd";

export interface JobCodeRate {
  code: string;
  title: string;
  instructorType: InstructorType;
  /**
   * Dollars per course. Null when no rate exists at or
   * before the fiscal year.
   */
  costPerCourse: number | null;
  rateFiscalYear: number | null;
  source: string | null;
}

export interface TaAppointmentRate {
  season: Season;
  studentStatus: StudentStatus;
  appointmentPercent: number;
  /** Salary plus fringe, in dollars, for one term. */
  costPerTerm: number;
  source: string | null;
}

export type CostSettingType = "money" | "percent" | "count" | "toggle";

export type CostSettingValue = number | boolean;

export interface CostSetting {
  key: string;
  label: string;
  description: string;
  type: CostSettingType;
  default: CostSettingValue;
  value: CostSettingValue;
  /**
   * The fiscal year `value` was saved for. Null when it is
   * the default.
   */
  valueFiscalYear: number | null;
}

export interface CostPerson {
  emplid: number;
  jobCodes: string[];
}

export interface PersonChoice {
  emplid: number;
  jobCode: string | null;
  instructorType: InstructorType | null;
  studentStatus: StudentStatus | null;
  overrideCost: number | null;
  overrideReason: string | null;
}

export interface CostAssumptions {
  termCode: number;
  fiscalYear: number;
  season: Season;
  jobCodes: JobCodeRate[];
  taRates: {
    /**
     * The latest fiscal year with any TA rate. Null when
     * none is entered.
     */
    fiscalYear: number | null;
    rates: TaAppointmentRate[];
  };
  settings: CostSetting[];
  people: CostPerson[];
  personChoices: PersonChoice[];
  canEdit: boolean;
}

export interface EnrollmentHistorySection {
  courseCode: string;
  section: string;
  termCode: number;
  enrollmentTotal: number;
  enrollmentCap: number;
  waitlistTotal: number;
  leadInstructorLastName: string | null;
  meetings: SisSectionMeeting[];
}

export interface EnrollmentHistory {
  /** Oldest first. */
  termCodes: number[];
  sections: EnrollmentHistorySection[];
}
