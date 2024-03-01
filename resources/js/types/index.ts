import type { AxiosRequestConfig } from "axios";
export type CSSClass = string | Record<string, boolean> | CSSClass[];

export interface UserLookupItem {
  full_name: string; // "John Smith"
  mail: string; // "john@umn.edu"
  uid: string; // "john"
  umndid: string; // "wx74jdbk"
}

export type ISODateTime = string; // "2023-08-04T19:52:04.000000Z"
export type ISODate = string; // "2023-08-04"

export const UserPermissions = {
  CREATE_GROUPS: "create groups",
  EDIT_GROUPS: "edit groups",
  EDIT_USERS: "edit users",
  EDIT_LEAVES: "edit leaves",
  EDIT_PLANNED_COURSES: "edit planned courses",
  SCHEDULE_DEPTS: "schedule departments",
  VIEW_OWN_GROUPS: "view own groups",
  VIEW_GROUPS: "view groups",
  VIEW_PRIVATE_GROUPS: "view private groups",
  VIEW_USERS: "view users",
  VIEW_REPORTS: "view reports",
  VIEW_LEAVES: "view leaves",
  VIEW_ELIGIBILITY: "view eligibility",
  VIEW_PLANNED_COURSES: "view planned courses",
} as const;

export type UserPermission =
  (typeof UserPermissions)[keyof typeof UserPermissions];

export interface BaseUser {
  id: number;
  givenname: string;
  surname: string;
  displayName: string;
  email?: string;
  umndid?: string;
  emplid?: number;
  office: string | null;
  phone?: string | null;
  title: string | null;
  ou: string | null;
  memberships: Membership[];
  favoriteGroups: Group[];
  favoriteRoles: MemberRole[];
  seen_tour?: boolean;
  send_email_reminders: boolean;
  notify_of_favorite_changes: boolean;
  permissions: UserPermission[];
  ssl_eligible: boolean;
  midcareer_eligible: boolean;
  ssl_apply_eligible: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at: ISODateTime | null;
}

export interface NormalizedUser extends BaseUser {
  leaves: Leave["id"][];
}

export interface User extends BaseUser {
  leaves: Leave[];
}

export interface Membership {
  id: number;
  filtered: false; // what does this do? Is it a front-end state thing? Does it need to be sticky?
  user: User;
  role: MemberRole;
  start_date: ISODate; // can this be null?
  end_date: ISODate | null;
  admin: 1 | 0;
  notes: null;
  group: Group;
}

export interface GroupType {
  id: number;
  label: string; // "ACademic Department"
  pivot?: {
    role_id: number;
    group_type_id: number;
  };
}

export interface MemberRole {
  id: number;
  label: string; // "Academic Chair"
  created_at: ISODateTime | null; // why null?
  updated_at: ISODateTime | null; // why null?
  deleted_at?: ISODateTime | null;
  official_role_category_id: number;
  official_role_category?: {
    id: number;
    category: string; // "College" or "Unit"
  };
  official_group_type: GroupType[];
  members?: Membership[];
}

export interface ParentOrganization {
  // group folder?
  id: number;
  group_title: string;
  parent_organization_id: number;
  child_organizations_recursive: ParentOrganization[];
}

export interface BaseGroup {
  id: number;
  user_can_edit: boolean; // current user can edit
  group_title: string | null; // "Anthropology";
  abbreviation: string | null; // "ANTH";
  group_type_id?: number;
  dept_id: string | null;
  group_type: GroupType;
  private_group: 0 | 1;
  parent_group_id: number | null;
  parent_group: Group | null;
  child_groups?: ChildGroup[];

  include_child_groups?: boolean; // should child groups be included in the member list?
  google_group: string | null;
  show_unit?: 0 | 1;
  secret_hash: string;
  parent_organization: ParentOrganization;
  parent_organization_id: number;
  artifacts: GroupArtifact[];
  notes: string | null;
  members: Membership[];
  created_at: ISODateTime | null; // why null?
  updated_at: ISODateTime | null; // why null?
  deleted_at?: ISODateTime | null;
}

export interface Group extends BaseGroup {
  active: 0 | 1;
}

// TODO: unify `active` and `active_group` into a single field
export interface ChildGroup extends BaseGroup {
  active_group: 0 | 1;
}

export interface Artifact {
  id: number | string;
  label: string;
  target: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface GroupArtifact extends Artifact {
  group_id: number;
}

export interface LeaveArtifact extends Artifact {
  leave_id: number | string;
}

export const leaveTypes = {
  SABBATICAL: "sabbatical",
  DEVELOPMENT: "development",
  SINGLE_SEMESTER: "single_semester",
  COURSE_RELEASE: "course_release",
  COURSE_BUYOUT: "course_buyout",
  OTHER: "other",
} as const;

export type LeaveType = (typeof leaveTypes)[keyof typeof leaveTypes];

export const leaveStatuses = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  ELIGIBLE: "eligible",
  CANCELLED: "cancelled",
} as const;

export type LeaveStatus = (typeof leaveStatuses)[keyof typeof leaveStatuses];

export interface Leave {
  id: number;
  user_id: User["id"];
  description: string;
  type: LeaveType;
  status: LeaveStatus;
  start_date: ISODate;
  end_date: ISODate;
  artifacts?: LeaveArtifact[];
  termIds?: Term["id"][]; // leave overlaps with these terms
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime | null;
}

export interface LeaveWithPerson extends Leave {
  person: Person;
}
export interface NewLeave {
  id?: string | number;
  user_id: number;
  description: string;
  type: LeaveType;
  status: LeaveStatus;
  start_date: ISODate;
  end_date: ISODate;
  artifacts?: LeaveArtifact[];
}

export interface Term {
  id: number;
  name: string;
  startDate: ISODate;
  endDate: ISODate;
}

export type TermCode = "FA" | "SP" | "SU";

export const enrollmentRoleMap = {
  PI: "Instructor", // Primary Instructor
  TA: "Teaching Assistant",
} as const;

export type EnrollmentRole = keyof typeof enrollmentRoleMap;

export interface Person {
  id: User["id"];
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

type DBEnrollmentId = `db-${NonNullable<Enrollment["dbId"]>}`;
type SISEnrollmentId = `sis-${NonNullable<
  Enrollment["sectionId"]
>}-${NonNullable<Enrollment["emplid"]>}`;

export interface Enrollment {
  id: DBEnrollmentId | SISEnrollmentId;
  dbId: number | null;
  emplid: Person["emplid"];
  sectionId: CourseSection["id"];
  role: EnrollmentRole;
}

export interface AcademicDepartment {
  groupId: Group["id"];
  deptId: number;
  name: string;
  abbreviation: string;
}

// these courses come from the bandaid api and are all considered published
export type SISSectionId = `sis-${NonNullable<CourseSection["classNumber"]>}`;

// these courses come from the app db and are likely unpublished
export type DbSectionId = `db-${NonNullable<CourseSection["dbId"]>}`;

export interface CourseSection {
  id: SISSectionId | DbSectionId;
  classNumber: ApiCourseSectionRecord["classNumber"];
  dbId: ApiCourseSectionRecord["dbId"];
  courseId: Course["id"]; // short code like "HIST-1001W"
  termId: Term["id"];
  classSection: string; // "001"
  waitlistCap: number;
  waitlistTotal: number;
  enrollmentCap: number;
  enrollmentTotal: number;
  isCancelled: boolean;
  isPublished: boolean; // true if from bandaid, false if from app DB
  groupId: Group["id"];
}

export interface CourseSectionWithEnrollments extends CourseSection {
  enrollments: Enrollment[];
}

export type CourseShortCode = `${Course["subject"]}-${Course["catalogNumber"]}`;

export interface Course {
  id: CourseShortCode; // subject-catalogNumber
  courseCode: CourseShortCode;
  subject: string; // HIST
  catalogNumber: string; // "1001W"
  title: string; // course name
  courseType: string; // "LEC"
  courseLevel: string; //"UGRD" | "GRAD";
  source: "sis" | "local";
}

export interface ApiCourseSectionRecord {
  id: SISSectionId | DbSectionId;
  classNumber: number | null; // null if from db
  dbId: number | null; // null if from sis (bandaid)
  termId: number;
  courseId: CourseShortCode; // subject-catalogNumber
  classSection: string; // "001"
  enrollmentCap: number;
  enrollmentTotal: number;
  waitlistCap: number;
  waitlistTotal: number;
  enrollments: Enrollment[];
  isCancelled: boolean;
  isPublished: boolean; // true if from bandaid,
}

// api response types
export type ApiUserResponse = User;
export type ApiGroupMembersReponse = Membership[];
export type ApiGroupRolesResponse = MemberRole[];
export type ApiGroupResponse = Group;
export interface ApiUserLookupResponse {
  items: UserLookupItem[];
}

// used for api requests via Bandaid
export type InstructorRole = EnrollmentRole;

export type LoadState = "idle" | "loading" | "complete" | "error";

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  skipErrorNotifications?: boolean;
}

export interface SelectOption {
  text: string;
  value: string | number;
}

export type DragDropMeta = Record<string, unknown>;

export interface DropEvent<
  ItemType,
  MetaDataType extends DragDropMeta = DragDropMeta,
> {
  item: ItemType;
  sourceListId: DragListId;
  targetListId: DragListId;
  sourceListMeta: MetaDataType;
  targetListMeta: MetaDataType;
}

export interface DragListItem {
  id: number | string;
  [key: string]: unknown;
}

export type DragListId = string | number;

export interface CoursePlanningFilters {
  startTermId: number | null;
  endTermId: number | null;
  excludedCourseLevels: Set<string>;
  excludedCourseTypes: Set<string>;
  excludedAcadAppts: Set<string>;
  includedEnrollmentRoles: Set<EnrollmentRole>;
  search: string;
  inPlanningMode: boolean;
}

export interface SerializedCoursePlanningFilters {
  startTermId: number | null;
  endTermId: number | null;
  excludedCourseLevels: string[];
  excludedCourseTypes: string[];
  excludedAcadAppts: string[];
  includedEnrollmentRoles: EnrollmentRole[];
  search: string;
  inPlanningMode: boolean;
}

export interface JoinedEnrollmentRecord {
  id: Enrollment["id"];
  person: Person;
  enrollment: Enrollment;
  section: CourseSection;
  course: Course;
  term: Term;
}

export interface CoursePlanningLookups {
  personLookupByEmplid: Record<Person["emplid"], Person>;
  personLookupByUserId: Record<Person["id"], Person>;
  termLookup: Record<Term["id"], Term>;
  courseLookup: Record<Course["id"], Course>;
  sectionLookup: Record<CourseSection["id"], CourseSection>;
  enrollmentLookup: Record<Enrollment["id"], Enrollment>;
  leaveLookup: Record<Leave["id"], Leave>;
}

export interface PersonTableTermRecord {
  term: Term;
  enrollments: JoinedEnrollmentRecord[];
  leaves: Leave[];
}

export type PersonTableRow = [Person, ...PersonTableTermRecord[]];

export interface PersonSpreadsheetRowRecord {
  id: string; // emplid
  surName: Person["surName"];
  givenName: Person["givenName"];
  academicAppointment: Person["academicAppointment"];
  [termName: string]: string; // concatenated list of leaves and enrollments
}

export interface TermLeaves {
  term: Term;
  leaves: LeaveWithPerson[];
}

export type LeaveRow = ["leaves", ...TermLeaves[]];

// TODO: make this the same shape as PersonTableTermRecord
export interface CourseTableTermRecord {
  term: Term;
  joinedEnrollments: JoinedEnrollmentRecord[];
}

export type CourseTableRow = [Course, ...CourseTableTermRecord[]];

export interface CourseSpreadsheetRowRecord {
  id: string; // course id
  title: string;
  courseLevel: string;
  courseType: string;
  [termName: string]: string; // concatenated list of people
}

export type SpreadsheetRecords = Record<string, string | number>[];

export interface SpreadsheetData {
  sheetName: string;
  data: SpreadsheetRecords | (() => Promise<SpreadsheetRecords>);
}
