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

export async function fetchTerms() {
  const res = await axios.get<T.Term[]>(`/api/terms`);
  return res.data;
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

interface ApiNewCourseSection {
  course: T.Course;
  term: T.Term;
  groupId: T.Group["id"];
}

export async function createCourseSectionInGroup({
  course,
  term,
  groupId,
}: ApiNewCourseSection) {
  const res = await axios.post<T.CourseSection>(
    `/api/course-planning/groups/${groupId}/sections`,
    {
      course_id: course.id,
      term_id: term.id,
      class_section: "TBD",
    },
  );
  return res.data;
}

interface NewCourseEnrollment {
  person: T.Person;
  role: T.EnrollmentRole;
  section: T.CourseSection;
  groupId: T.Group["id"];
}

export async function createEnrollmentInGroup({
  person,
  role,
  section,
  groupId,
}: NewCourseEnrollment): Promise<T.Enrollment> {
  const res = await axios.post<T.Enrollment>(
    `/api/course-planning/groups/${groupId}/enrollments`,
    {
      emplid: person.emplid,
      role,
      course_section_id: section.dbId,
    },
  );
  return res.data;
}

export async function deleteEnrollmentFromGroup(
  enrollment: T.Enrollment,
  groupId: T.Group["id"],
) {
  const res = await axios.delete(
    `/api/course-planning/groups/${groupId}/enrollments/${enrollment.dbId}`,
  );
  return res.data;
}

function parseDbIdFromSectionId(sectionId: T.Enrollment["sectionId"]) {
  // enrollment id is in the form: db-1234
  const [source, dbId] = sectionId.split("-");

  if (source !== "db") {
    throw new Error(`Section id ${sectionId} does not have a dbId`);
  }
  return dbId;
}

export async function updateEnrollmentInGroup(
  enrollment: T.Enrollment,
  groupId: T.Group["id"],
) {
  const sectionDbId = parseDbIdFromSectionId(enrollment.sectionId);

  console.log("updateEnrollmentInGroup", { enrollment, groupId, sectionDbId });

  const res = await axios.put<T.Enrollment>(
    `/api/course-planning/groups/${groupId}/enrollments/${enrollment.dbId}`,
    {
      course_section_id: sectionDbId,
      emplid: enrollment.emplid,
      role: enrollment.role,
    },
  );
  return res.data;
}

export async function updateSectionInGroup(
  section: T.CourseSection,
  groupId: T.Group["id"],
) {
  console.log("updateSectionInGroup", { section, groupId });

  const res = await axios.put<T.CourseSection>(
    `/api/course-planning/groups/${groupId}/sections/${section.dbId}`,
    {
      course_id: section.courseId,
      term_id: section.termId,
      class_section: section.classSection,
      enrollment_cap: section.enrollmentCap,
      enrollment_total: section.enrollmentTotal,
      is_cancelled: section.isCancelled,
      is_published: section.isPublished,
    },
  );
  return res.data;
}

export async function removeSectionFromGroup(
  section: T.CourseSection,
  groupId: T.Group["id"],
) {
  const res = await axios.delete(
    `/api/course-planning/groups/${groupId}/sections/${section.dbId}`,
  );
  return res.data;
}
