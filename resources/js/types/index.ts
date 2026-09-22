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
  EDIT_PLANNED_COURSES: "edit planned courses",
  SCHEDULE_DEPTS: "schedule departments",
  VIEW_OWN_GROUPS: "view own groups",
  VIEW_GROUPS: "view groups",
  VIEW_PRIVATE_GROUPS: "view private groups",
  VIEW_USERS: "view users",
  VIEW_REPORTS: "view reports",
  EDIT_ANY_LEAVES: "edit leaves",
  VIEW_ANY_LEAVES: "view leaves",
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
  canCurrentUser: ApiResourceItemPermissions;
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
  COURSE_RELEASE_REGENTS: "course_release_regents",
  COURSE_RELEASE_NON_ADMINISTRATIVE: "course_release_non_administrative",
  TEACHING_FREE_SEMESTER: "teaching_free_semester",
  COURSE_BUYOUT: "course_buyout",
  PHASED_RETIREMENT: "phased_retirement",
  UNPAID_DISCRETIONARY: "unpaid_discretionary",
  OTHER: "other",
} as const;

export type LeaveType = (typeof leaveTypes)[keyof typeof leaveTypes];

export const leaveTypeLabels: Record<LeaveType, string> = {
  [leaveTypes.SABBATICAL]: "Sabbatical",
  [leaveTypes.DEVELOPMENT]: "CLAFDL",
  [leaveTypes.SINGLE_SEMESTER]: "Single Semester",
  [leaveTypes.COURSE_RELEASE]: "Course Release (Administrative)",
  [leaveTypes.COURSE_RELEASE_REGENTS]: "Course Release (Regents Professor)",
  [leaveTypes.COURSE_RELEASE_NON_ADMINISTRATIVE]:
    "Course Release (Non-Administrative)",
  [leaveTypes.TEACHING_FREE_SEMESTER]: "Teaching-Free Semester",
  [leaveTypes.COURSE_BUYOUT]: "Course Buyout",
  [leaveTypes.PHASED_RETIREMENT]: "Phased Retirement",
  [leaveTypes.UNPAID_DISCRETIONARY]: "Unpaid Discretionary",
  [leaveTypes.OTHER]: "Other",
};

// constants for db strings for indicating status
export const leaveStatuses = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  ELIGIBLE: "eligible",
  DEFERRED: "cancelled",
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
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime | null;
  canCurrentUser?: ApiResourceItemPermissions;
}

/**
 * One leave overlapping the term on screen, for someone appointed to the
 * department. See App\Http\Controllers\Sis\GroupLeaveController.
 */
export interface TermLeave {
  id: number;
  /** BlueSheet user id, which /user/:userId takes. */
  userId: number;
  /** SIS emplid, which the roster and a section's instructors key on. */
  emplid: number | null;
  name: string | null;
  lastName: string | null;
  type: LeaveType;
  status: Exclude<LeaveStatus, typeof leaveStatuses.DEFERRED>;
  startDate: string;
  endDate: string;
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

// api response types
export interface ApiUserResponse extends BaseUser {
  leaves?: Leave[];
}

export type ApiGroupMembersReponse = Membership[];
export type ApiGroupRolesResponse = MemberRole[];
export type ApiGroupResponse = Group;
export interface ApiUserLookupResponse {
  items: UserLookupItem[];
}

export type LoadState = "idle" | "loading" | "complete" | "error";

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  skipErrorNotifications?: boolean;
}

export interface SelectOption {
  text: string;
  value: string | number;
}

export type SpreadsheetRecords = Record<string, string | number>[];

export interface SpreadsheetData {
  sheetName: string;
  data: SpreadsheetRecords | (() => Promise<SpreadsheetRecords>);
}

export interface DeptLeavesReportRow {
  group: {
    id: number;
    name: string;
    dept_id: string;
    abbreviation: string;
  };
  leavesByTerm: {
    term: string;
    leaveCountByStatus: Record<LeaveStatus, number> & { all: number };
  }[];
}

export interface ApiResourcePermissions {
  viewAny: boolean;
  create: boolean;
}

export interface ApiResourceItemPermissions {
  update: boolean;
  delete: boolean;
}

export interface LeaveDateOption {
  date: ISODate;
  term: string; // "Fall 2024"
}
export interface ApiLeaveDateOptions {
  startDateOptions: LeaveDateOption[];
  endDateOptions: LeaveDateOption[];
}

/** A roster entry, read off the appointment that placed the person there. */
export interface SisEmployee {
  emplid: number;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  internetId: string | null;
  positionTitle: string | null;
  category: string | null;
}

export interface TermPayrollDate {
  id: number;
  term_code: number;
  semester: string; // "Spring", "Fall"
  year: number; // academic year
  payroll_start_date: ISODate;
  payroll_end_date: ISODate;
}
export * from "./leavePlanning";
