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
  academicAppointment: string; // "Faculty"
  leaveIds: Leave["id"][];
  midcareerEligible: boolean;
  sslEligible: boolean;
  sslApplyEligible: boolean;
}

/**
 * a person in a course section with a particular role
 * like "primary instructor" or "teaching assistant"
 */
export interface Enrollment {
  id: `${Enrollment["sectionId"]}-${Enrollment["emplId"]}`;
  role: EnrollmentRole;
  emplId: Person["emplid"];
  sectionId: CourseSection["id"];
}

export interface AcademicDepartment {
  groupId: Group["id"];
  deptId: number;
  name: string;
  abbreviation: string;
}

export interface ApiGetGroupCoursePlanningResponse {
  dept: AcademicDepartment;
  terms: Term[];
  courses: Course[];
  courseSections: CourseSection[];
  enrollments: Enrollment[];
  persons: Person[];
  leaves: Leave[];
}

export interface CourseSection {
  id: ApiCourseInstructorRecord["classNumber"];
  courseId: Course["id"]; // short code like "HIST-1001W"
  termId: Term["id"];
  classSection: string; // "001"
  enrollmentCap: number;
  enrollmentTotal: number;
  enrollments: Enrollment[];
  status: "active" | "tentative" | "cancelled";
}

export interface Course {
  id: CourseShortCode; // subject-catalogNumber
  subject: string; // HIST
  catalogNumber: string; // "1001W"
  title: string; // course name
  courseType: string; // "LEC"
  courseLevel: string; //"UGRD" | "GRAD";
}
