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

type UserPermission = (typeof UserPermissions)[keyof typeof UserPermissions];

export interface User {
  id: number;
  givenname: string;
  surname: string;
  displayName: string;
  email: string;
  umndid?: string;
  emplid?: number;
  office: string | null;
  phone?: string | null;
  title: string | null;
  ou: string | null;
  memberships: [];
  favoriteGroups: [];
  favoriteRoles: [];
  seen_tour?: 1 | 0;
  send_email_reminders: 1 | 0;
  notify_of_favorite_changes: 1 | 0;
  permissions: UserPermission[];
  leaves?: Leave[];
  created_at: ISODateTime;
  updated_at: ISODateTime;
  deleted_at: ISODateTime | null;
}

export interface MembershipWithGroups {
  id: number;
  filtered: false; // what does this do? Is it a front-end state thing? Does it need to be sticky?
  user: User;
  role: MemberRole;
  start_date: ISODate; // can this be null?
  end_date: ISODate | null;
  admin: 1 | 0;
  notes: null;
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

export const LeaveTypes = {
  SABBATICAL: "sabbatical",
  DEVELOPMENT: "development",
  SINGLE_SEMESTER: "single_semester",
  COURSE_RELEASE: "course_release",
  COURSE_BUYOUT: "course_buyout",
  OTHER: "other",
} as const;

export type LeaveType = (typeof LeaveTypes)[keyof typeof LeaveTypes];

export const LeaveStatuses = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
  CANCELLED: "cancelled",
} as const;

export type LeaveStatus = (typeof LeaveStatuses)[keyof typeof LeaveStatuses];

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

export interface ApiCreateLeaveRequest {
  user_id: number;
  description: string;
  type: LeaveType;
  status: LeaveStatus;
  start_date: ISODate;
  end_date: ISODate;
}

// api response types
export type ApiUserResponse = User;
export type ApiGroupMembersReponse = MembershipWithGroups[];
export type ApiGroupRolesResponse = MemberRole[];
export type ApiGroupResponse = Group;
export interface ApiUserLookupResponse {
  items: UserLookupItem[];
}
