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
   * category reads "Unspecified".
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
  startTermId: number;
  endTermId: number;
}

export interface LeaveTimeline {
  /** Null when the group names no SIS department. */
  range: PlanningTermRange | null;
  people: PlanningPerson[];
  leaves: PlanningLeave[];
}

export interface TeachingInstructor {
  emplid: number;
  /** "PI", "SI", or "TA" */
  role: string;
}

export interface TeachingSection {
  /** e.g. "ANTH-1001-003-FA26" */
  key: string;
  termId: number;
  courseCode: string;
  subject: string;
  catalogNumber: string;
  section: string;
  title: string;
  component: string;
  /** Null for a planned section. */
  career: string | null;
  /** Null for a planned section, which nobody can enroll in yet. */
  enrollmentTotal: number | null;
  enrollmentCap: number;
  isPlanned: boolean;
  instructors: TeachingInstructor[];
}

export interface TeachingHistory {
  people: PlanningPerson[];
  sections: TeachingSection[];
}

export interface PlanningGroup {
  id: number;
  name: string | null;
  abbreviation: string | null;
}

export interface PlanningTerm {
  /** The term code, e.g. 1269. */
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
}
