import { axios } from "@/utils";
import type * as Types from "@/types";
import { isTempId } from "@/utils";
import { omit } from "lodash";

export async function lookupUsers(
  query: string,
): Promise<Types.UserLookupItem[]> {
  const res = await axios.get<Types.ApiUserLookupResponse>(
    `/api/autocompleter/user?searchType=nameAndInternetId&q=${query}`,
  );
  return res.data.items;
}

export async function getUser(userId: number): Promise<Types.User> {
  const res = await axios.get<Types.ApiUserResponse>(`/api/user/${userId}`);
  return res.data;
}

export async function updateUser(user: Types.User) {
  const res = await axios.put<Types.User>(`/api/user/${user.id}`, user);
  return res.data;
}

export async function createLeave(leave: Types.NewLeave) {
  const res = await axios.post<Types.Leave>(`/api/leaves`, leave);
  return res.data;
}

function normalizeLeaveArtifacts(leaveArtifacts: Types.LeaveArtifact[]) {
  // remove any artifacts without labels or urls
  return leaveArtifacts
    .filter((artifact) => artifact.label?.length || artifact.target?.length)
    .map((artifact) => {
      // strip any temp ids
      return isTempId(artifact.id) ? omit(artifact, "id") : artifact;
    });
}

export async function updateLeave(leave: Types.Leave) {
  const res = await axios.put<Types.Leave>(`/api/leaves/${leave.id}`, {
    ...leave,
    artifacts: normalizeLeaveArtifacts(leave.artifacts ?? []),
  });
  return res.data;
}

export async function deleteLeave(leaveId: number) {
  const res = await axios.delete(`/api/leaves/${leaveId}`);
  return res.data;
}

export async function getUserLeaves(userId: number): Promise<Types.Leave[]> {
  const res = await axios.get<Types.Leave[]>(`/api/users/${userId}/leaves`);
  return res.data;
}

export async function updateUserLeaves(userId: number, leaves: Types.Leave[]) {
  const res = await axios.put<Types.Leave[]>(`/api/users/${userId}/leaves`, {
    leaves,
  });
  return res.data;
}

let getTermsCache = [] as Types.Term[];
export async function getTerms() {
  if (getTermsCache.length) {
    return getTermsCache;
  }
  const res = await axios.get<Types.Term[]>(`/api/terms`);
  getTermsCache = res.data;
  return res.data;
}

const toCourse = (
  rawCourse: Types.ApiCourseInstructorRecord,
): Types.Course => ({
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
  roles: Types.InstructorRole[];
}) {
  const res = await axios.get<Types.ApiCourseInstructorRecord[]>(
    `/api/terms/${termId}/groups/${groupId}/courses`,
    {
      params: {
        includeRoles: roles.length ? roles.join(",") : undefined,
      },
    },
  );

  const coursesByClassNumber = new Map<
    Types.Course["classNumber"],
    Types.Course
  >();

  res.data.forEach((rawCourse) => {
    const course =
      coursesByClassNumber.get(rawCourse.classNumber) ?? toCourse(rawCourse);
    course.instructors.push(rawCourse.instructor);

    coursesByClassNumber.set(rawCourse.classNumber, course);
  });

  return [...coursesByClassNumber.values()];
}

export async function getGroup(groupId: number) {
  const res = await axios.get<Types.Group>(`/api/group/${groupId}`);
  return res.data;
}

export async function createLeaveArtifact(artifact: Types.LeaveArtifact) {
  const res = await axios.post<Types.LeaveArtifact>(
    `/api/leaves/${artifact.leave_id}/artifacts`,
    omit(artifact, "id"), // omit temp id
  );
  return res.data;
}

export async function updateLeaveArtifact(artifact: Types.LeaveArtifact) {
  if (!artifact.id || isTempId(artifact.id)) {
    throw new Error("Cannot update artifact without id");
  }

  const res = await axios.put<Types.LeaveArtifact>(
    `/api/leaves/${artifact.leave_id}/artifacts/${artifact.id}`,
    artifact,
  );
  return res.data;
}

export async function deleteLeaveArtifact(artifact: Types.LeaveArtifact) {
  const res = await axios.delete(
    `/api/leaves/${artifact.leave_id}/artifacts/${artifact.id}`,
  );
  return res.data;
}
