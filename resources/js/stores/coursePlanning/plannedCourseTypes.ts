import {
  Leave,
  ApiCourseInstructorRecord,
  CourseShortCode,
  Term,
  Group,
} from "@/types";

export type EnrollmentRole = "PI" | "TA";

export interface Person {
  id: number;
  emplid: number;
  title: string;
  jobCode: string;
  givenName: string;
  surName: string;
  displayName: string;
  email: string;
  leaveIds?: Leave["id"][];
  midcareerEligible: boolean;
  sslEligible: boolean;
  sslApplyEligible: boolean;
  academicAppointment: string; // "Faculty"
}

/**
 * a person in a course section with a particular role
 * like "primary instructor" or "teaching assistant"
 */
export interface Enrollment {
  id: number;
  role: EnrollmentRole;
  personId: Person["id"];
  sectionId: CourseSection["id"];
}

export interface CourseSection {
  id: ApiCourseInstructorRecord["classNumber"];
  courseId: Course["id"]; // short code
  termId: Term["id"];
  classSection: string; // "001"
  enrollmentCap: number;
  enrollmentTotal: number;
  enrollmentIds: Enrollment["id"][];
  status: "active" | "tentative" | "cancelled";
}

export interface Course {
  id: CourseShortCode; // subject-catalogNumber
  subject: string; // HIST
  catalogNumber: string; // "1001W"
  title: string; // course name
  courseType: string; // "LEC"
  courseLevel: string; //"UGRD" | "GRAD";
  groupId: Group["id"];
}
