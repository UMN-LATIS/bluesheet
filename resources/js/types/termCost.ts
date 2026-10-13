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
   * The TA appointment rate a TA holding this code is
   * costed at. Null means regular.
   */
  studentStatus: StudentStatus | null;
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

export interface CostPerson {
  emplid: number;
  jobCodes: string[];
  /**
   * By job code, from the person's appointment. Missing
   * when the appointment has no position description.
   */
  positionTitles: Partial<Record<string, string>>;
}

/** A planner's rate for one department and one term. */
export interface JobCodeRateOverride {
  jobCode: string;
  costPerCourse: number;
}

/** A planner's rate for one department and one term. */
export interface TaRateOverride {
  appointmentPercent: number;
  studentStatus: StudentStatus;
  costPerTerm: number;
}

/**
 * A planner's cost for one person on each section they are
 * paid for, in one department and one term. A TA is paid
 * once per course.
 */
export interface PersonRateOverride {
  emplid: number;
  amount: number;
}

/** A planner's cost for one person on one section. */
export interface CostLineOverride {
  courseCode: string;
  section: string;
  emplid: number;
  amount: number;
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
  people: CostPerson[];
  rateOverrides: {
    jobCodes: JobCodeRateOverride[];
    taAppointments: TaRateOverride[];
    people: PersonRateOverride[];
  };
  lineOverrides: CostLineOverride[];
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
