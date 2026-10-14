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
  /** Null on the unstaffed (TBA) row. */
  instructorType: InstructorType | null;
  /** Courses per year. Null when not entered. */
  annualLoad: number | null;
  /**
   * Dollars per paid section. Null when Nova has no rate
   * for the term, and always null for a grad job code,
   * which is costed from `CostAssumptions.gradRates`.
   */
  salary: number | null;
  /** A fraction: 0.385 is 38.5%. Null when Nova has no rate for the term. */
  fringeRate: number | null;
  source: string | null;
  /** Null on a job code that is not a grad student's. */
  studentStatus: StudentStatus | null;
}

export interface CostPerson {
  emplid: number;
  jobCodes: string[];
  /**
   * By job code, from the person's appointment. Missing
   * when the appointment has no position description.
   */
  positionTitles: Partial<Record<string, string>>;
}

/** A planner's rate for one department and one term. At least one field is set. */
export interface JobCodeRateOverride {
  jobCode: string;
  salary: number | null;
  fringeRate: number | null;
}

/**
 * A planner's salary for one person per paid section, in
 * one department and one term. Fringe is added on top.
 */
export interface PersonRateOverride {
  emplid: number;
  salary: number;
}

export interface GradRateInputs {
  hourlyRate: number;
  /** A fraction of pay: 0.289 is 28.9%. */
  healthRate: number;
  tuitionPerHourRegular: number;
  tuitionPerHourAbd: number;
  /** The full amount, before the appointment's share. */
  feeOffset: number;
  internationalOffset: number;
  perCreditPayment: number;
}

export type GradOverrideField =
  | keyof GradRateInputs
  | "defaultAppointmentPercent";

export interface GradAppointmentLevel {
  /** 12.5 is a 12.5% appointment. */
  appointmentPercent: number;
  hours: number;
}

/** One grad student's settings for one department and one term. */
export interface GradPerson {
  emplid: number;
  hasFeeOffset: boolean;
  isInternational: boolean;
}

export interface PersonNote {
  emplid: number;
  notes: string;
}

export interface CostAssumptions {
  termCode: number;
  season: Season;
  jobCodes: JobCodeRate[];
  people: CostPerson[];
  gradRates: {
    /** The admin's values for the term. Null when none are entered. */
    defaults: GradRateInputs | null;
    levels: GradAppointmentLevel[];
  };
  rateOverrides: {
    jobCodes: JobCodeRateOverride[];
    people: PersonRateOverride[];
    /** The department's values. Each field is null when not overridden. */
    grad: { [Field in GradOverrideField]: number | null } | null;
    gradHours: GradAppointmentLevel[];
  };
  gradPeople: GradPerson[];
  personNotes: PersonNote[];
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
