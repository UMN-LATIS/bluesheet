import type { SisSectionMeeting } from "@/pages/TermPlanningPage/types";

export type InstructorType =
  | "recurring_budget_faculty"
  | "recurring_budget_pa"
  | "contract_visiting"
  | "pa_instructor"
  | "graduate_instructor"
  | "teaching_assistant";

export type Season = "fall" | "spring" | "summer";

export interface JobCodeRate {
  code: string;
  title: string;
  /** Null on the unstaffed (TBA) row. */
  instructorType: InstructorType | null;
  /** Courses per year. Null when not entered. */
  annualLoad: number | null;
  /**
   * Dollars per paid section, or per course for a
   * teaching_assistant job code. Null when Nova has no
   * rate for the term.
   */
  salary: number | null;
  /** A fraction: 0.385 is 38.5%. Null when Nova has no rate for the term. */
  fringeRate: number | null;
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

export interface PersonNote {
  emplid: number;
  notes: string;
}

export interface CostAssumptions {
  termCode: number;
  season: Season;
  jobCodes: JobCodeRate[];
  people: CostPerson[];
  rateOverrides: {
    jobCodes: JobCodeRateOverride[];
    people: PersonRateOverride[];
  };
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
