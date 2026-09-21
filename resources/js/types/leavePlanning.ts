import type { LeaveStatus, LeaveType } from "./index";

export interface PlanningPerson {
  emplid: number;
  /** Null when no BlueSheet user has this emplid. */
  userId: number | null;
  name: string;
  firstName: string;
  lastName: string;
  title: string | null;
  /**
   * This department's appointments only. A blank
   * category arrives as "Unspecified".
   */
  categories: string[];
  jobCodes: string[];
  hasAppointment: boolean;
  sslEligible: boolean;
  sslApplyEligible: boolean;
  midcareerEligible: boolean;
}

export interface PlanningLeave {
  id: number;
  emplid: number;
  userId: number;
  type: LeaveType;
  status: LeaveStatus;
  /** "YYYY-MM-DD" */
  startDate: string;
  /** "YYYY-MM-DD" */
  endDate: string;
  description: string;
}

export interface PlanningTermRange {
  startTermCode: number;
  endTermCode: number;
}

export interface LeaveTimeline {
  /**
   * Null when the group names no SIS department, or
   * when no undergrad terms exist.
   */
  range: PlanningTermRange | null;
  people: PlanningPerson[];
  leaves: PlanningLeave[];
}

export interface TeachingInstructor {
  emplid: number;
  /** The SIS instructor role, e.g. "PI" */
  role: string;
}

export interface TeachingSection {
  /** e.g. "ANTH-1001-003-FA26" */
  key: string;
  termCode: number;
  courseCode: string;
  subject: string;
  catalogNumber: string;
  section: string;
  title: string;
  component: string;
  /**
   * Null for a planned section, which nobody can enroll in
   * yet.
   */
  enrollmentTotal: number | null;
  enrollmentCap: number;
  isPlanned: boolean;
  instructors: TeachingInstructor[];
}

export interface TeachingHistory {
  people: PlanningPerson[];
  sections: TeachingSection[];
  /** Terms in the range the SIS has published. */
  readOnlyTermCodes: number[];
}

export interface PlanningGroup {
  id: number;
  name: string | null;
  abbreviation: string | null;
}

export interface PlanningTerm {
  termCode: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
}
