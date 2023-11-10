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
  return res.data;
}

export async function updateUser(user: T.User) {
  const res = await axios.put<T.User>(`/api/user/${user.id}`, user);
  return res.data;
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

export async function updateUserLeaves(userId: number, leaves: T.Leave[]) {
  const res = await axios.put<T.Leave[]>(`/api/users/${userId}/leaves`, {
    leaves,
  });
  return res.data;
}

let getTermsCache = [] as T.Term[];
export async function getTerms() {
  if (getTermsCache.length) {
    return getTermsCache;
  }
  const res = await axios.get<T.Term[]>(`/api/terms`);
  getTermsCache = res.data;
  return res.data;
}

const toCourse = (rawCourse: T.ApiCourseInstructorRecord): T.Course => ({
  shortCode: `${rawCourse.subject}-${rawCourse.catalogNumber}`,
  classNumber: rawCourse.classNumber,
  term: rawCourse.term,
  subject: rawCourse.subject,
  catalogNumber: rawCourse.catalogNumber,
  classSection: rawCourse.classSection,
  title: rawCourse.title,
  enrollmentCap: rawCourse.enrollmentCap,
  enrollmentTotal: rawCourse.enrollmentTotal,
  cancelled: rawCourse.cancelled,
  courseType: rawCourse.courseType,
  courseLevel: rawCourse.courseLevel,
  instructors: [],
});

export async function getGroupCoursesByTerm({
  groupId,
  termId,
  roles,
}: {
  groupId: number;
  termId: number;
  roles: T.InstructorRole[];
}) {
  const res = await axios.get<T.ApiCourseInstructorRecord[]>(
    `/api/terms/${termId}/groups/${groupId}/courses`,
    {
      params: {
        includeRoles: roles.length ? roles.join(",") : undefined,
      },
    },
  );

  const coursesByClassNumber = new Map<T.Course["classNumber"], T.Course>();

  res.data.forEach((rawCourse) => {
    const course =
      coursesByClassNumber.get(rawCourse.classNumber) ?? toCourse(rawCourse);
    course.instructors.push(rawCourse.instructor);

    coursesByClassNumber.set(rawCourse.classNumber, course);
  });

  return [...coursesByClassNumber.values()];
}

export async function fetchGroup(groupId: number) {
  const res = await axios.get<T.Group>(`/api/group/${groupId}`);
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
