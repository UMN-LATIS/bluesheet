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
  SCHEDULE_DEPTS: "schedule departments",
  VIEW_OWN_GROUPS: "view own groups",
  VIEW_GROUPS: "view groups",
  VIEW_PRIVATE_GROUPS: "view private groups",
  VIEW_USERS: "view users",
  VIEW_REPORTS: "view reports",
  VIEW_LEAVES: "view leaves",
} as const;

export type UserPermission =
  (typeof UserPermissions)[keyof typeof UserPermissions];

export interface User {
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
  leaves?: Leave[];
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at: ISODateTime | null;
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
  official_group_type: GroupType[];
}

export interface ParentOrganization {
  // group folder?
  id: number;
  group_title: string;
  parent_organization_id: number;
}

export interface Group {
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
  child_groups?: ChildGroup[]; // how deep will this go?
  google_group: string | null;
  show_unit: 0 | 1;
  secret_hash: string;
  parent_organization: ParentOrganization;
  parent_organization_id: number;
  active: 0 | 1;
  artifacts: Artifact[]; // what's an artifact?
  notes: string | null;
}

export interface ChildGroup {
  id: number;
  group_title: string;
  group_type_id: number;
  private_group: 0 | 1;
  active_group: 0 | 1;
  start_date: ISODate | null;
  end_date: ISODate | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at: ISODateTime | null;
  parent_organization_id: number; // can this be null?
  google_group: string | null;
  show_unit: 0 | 1;
  parent_group_id: number;
  abbreviation: string | null;
  dept_id: string | null;
  notes: string | null;
}

export interface Artifact {
  id: number;
  label: string;
  target: string;
  group_id: number;
  created_at: Date;
  updated_at: Date;
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
  CANCELLED: "cancelled",
} as const;

export type LeaveStatus = (typeof leaveStatuses)[keyof typeof leaveStatuses];

export interface Leave {
  id: number;
  user_id: number;
  description: string;
  type: LeaveType;
  status: LeaveStatus;
  start_date: ISODate;
  end_date: ISODate;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at?: ISODateTime | null;
}

export interface NewLeave {
  id?: string | number;
  user_id: number;
  description: string;
  type: LeaveType;
  status: LeaveStatus;
  start_date: ISODate;
  end_date: ISODate;
}

export interface Term {
  id: number;
  TERM: number;
  TERM_BEGIN_DT: ISODate;
  TERM_END_DT: ISODate;
  TERM_DESCRIPTION: string;
  INSTITUTION: string;
  ACADEMIC_CAREER: string;
}

export interface Instructor {
  id: number;
  givenName: string;
  surName: string;
  displayName: string;
  email: string;
  leaves?: Leave[];
}

export type TermCode = "FA" | "SP" | "SU";

export interface Course {
  id: number;
  term: number;
  subject: string; // HIST
  catalogNumber: number; // 1001
  classNumber: number; // uniq id of course
  classSection: string; // "001"
  instructorRole: string; // 'PI' === Primary Instructor
  title: string; // course name
  enrollmentCap: number;
  enrollmentTotal: number;
  cancelled: boolean;
  instructor: Instructor;
}

// api response types
export type ApiUserResponse = User;
export type ApiGroupMembersReponse = Membership[];
export type ApiGroupRolesResponse = MemberRole[];
export type ApiGroupResponse = Group;
export interface ApiUserLookupResponse {
  items: UserLookupItem[];
}
