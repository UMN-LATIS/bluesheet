import { axios } from "@/utils";
import * as T from "@/types";
import { isTempId } from "@/utils";
import { omit } from "lodash";

export async function lookupUsers(query: string): Promise<T.UserLookupItem[]> {
  const res = await axios.get<T.ApiUserLookupResponse>(
    `/api/autocompleter/user?searchType=nameAndInternetId&q=${query}`,
  );
  return res.data.items;
}

export async function fetchUser(userId: number): Promise<T.User> {
  const res = await axios.get<T.ApiUserResponse>(`/api/user/${userId}`);
  return {
    ...res.data,
    leaves: res.data.leaves ?? [],
  };
}

export async function updateUser(user: T.User): Promise<T.User> {
  const res = await axios.put<T.ApiUserResponse>(`/api/user/${user.id}`, user);
  return {
    ...res.data,
    leaves: res.data.leaves ?? [],
  };
}

export async function createLeave(leave: T.NewLeave) {
  const res = await axios.post<T.Leave>(`/api/leaves`, leave);
  return res.data;
}

function normalizeLeaveArtifacts(leaveArtifacts: T.LeaveArtifact[]) {
  // remove any artifacts without labels or urls
  return leaveArtifacts
    .filter((artifact) => artifact.label?.length || artifact.target?.length)
    .map((artifact) => {
      // strip any temp ids
      return isTempId(artifact.id) ? omit(artifact, "id") : artifact;
    });
}

export async function updateLeave(leave: T.Leave) {
  const res = await axios.put<T.Leave>(`/api/leaves/${leave.id}`, {
    ...leave,
    artifacts: normalizeLeaveArtifacts(leave.artifacts ?? []),
  });
  return res.data;
}

export async function deleteLeave(leaveId: number) {
  const res = await axios.delete(`/api/leaves/${leaveId}`);
  return res.data;
}

export async function getUserLeaves(userId: number): Promise<T.Leave[]> {
  const res = await axios.get<T.Leave[]>(`/api/users/${userId}/leaves`);
  return res.data;
}

export async function fetchTerms() {
  const res = await axios.get<T.Term[]>(`/api/terms`);
  return res.data;
}

export async function fetchGroup(groupId: number) {
  const res = await axios.get<T.Group>(`/api/group/${groupId}`);
  return res.data;
}

export async function createGroup(newGroupData: {
  groupName: string;
  parentOrganizationId: T.ParentOrganization["id"];
  groupType: T.GroupType["label"] | T.GroupType["id"];
  parentGroupId?: T.Group["id"];
}) {
  const res = await axios.post<T.Group>(`/api/group`, newGroupData);
  return res.data;
}

export async function createLeaveArtifact(artifact: T.LeaveArtifact) {
  const res = await axios.post<T.LeaveArtifact>(
    `/api/leaves/${artifact.leave_id}/artifacts`,
    omit(artifact, "id"), // omit temp id
  );
  return res.data;
}

export async function updateLeaveArtifact(artifact: T.LeaveArtifact) {
  if (!artifact.id || isTempId(artifact.id)) {
    throw new Error("Cannot update artifact without id");
  }

  const res = await axios.put<T.LeaveArtifact>(
    `/api/leaves/${artifact.leave_id}/artifacts/${artifact.id}`,
    artifact,
  );
  return res.data;
}

export async function deleteLeaveArtifact(artifact: T.LeaveArtifact) {
  const res = await axios.delete(
    `/api/leaves/${artifact.leave_id}/artifacts/${artifact.id}`,
  );
  return res.data;
}

export async function fetchCurrentUser() {
  const res = await axios.get<T.User>(`/api/user/show`);
  return res.data;
}

export async function postGroupFavorite(groupId: number): Promise<boolean> {
  const res = await axios.post<{ status: string }>(
    `/api/user/favorite/groups/${groupId}`,
  );
  return res.data.status === "success";
}

export async function deleteGroupFavorite(groupId: number) {
  const res = await axios.delete(`/api/user/favorite/groups/${groupId}`);
  return res.data;
}

export async function postRoleFavorite(roleId: number): Promise<boolean> {
  const res = await axios.post<{ status: string }>(
    `/api/user/favorite/roles/${roleId}`,
  );
  return res.data.status === "success";
}

export async function deleteRoleFavorite(roleId: number) {
  const res = await axios.delete(`/api/user/favorite/roles/${roleId}`);
  return res.data;
}

export async function fetchAllGroupRoles() {
  const res = await axios.get<T.MemberRole[]>(`/api/group/roles`);
  return res.data;
}

export async function fetchRole(roleId: number) {
  const res = await axios.get<T.MemberRole>(`/api/role/${roleId}`);
  return res.data;
}

export async function fetchParentOrganizations() {
  const res = await axios.get<T.ParentOrganization[]>(`/api/group/parents`);

  return res.data;
}

export async function getDeptLeavesReport() {
  const res = await axios.get<T.DeptLeavesReportRow[]>(
    `/api/reports/deptLeavesReport`,
  );

  return res.data;
}

/**
 * fetches permissions to view/create leaves for a user
 */
export async function getPermissionsForUserLeaves(leaveOwnerId: number) {
  const res = await axios.get<T.ApiResourcePermissions>(
    `/api/permissions/users/${leaveOwnerId}/leaves`,
  );

  return res.data;
}

export async function getPermissionsForGroupLeaves(groupId: number) {
  const res = await axios.get<T.ApiResourcePermissions>(
    `/api/permissions/groups/${groupId}/leaves`,
  );

  return res.data;
}

export async function getPermissionsForGroupCourses(groupId: number) {
  const res = await axios.get<T.ApiResourcePermissions>(
    `/api/permissions/groups/${groupId}/courses`,
  );

  return res.data;
}

export async function getPermissionsForSubgroupsOf(groupId: T.Group["id"]) {
  const res = await axios.get<T.ApiResourcePermissions>(
    `/api/permissions/groups/${groupId}/subgroups`,
  );

  return res.data;
}

export async function getTermPayrollDates() {
  const res = await axios.get<T.TermPayrollDate[]>(`/api/terms/payrollDates`);
  return res.data;
}
