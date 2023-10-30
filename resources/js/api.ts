import { axios } from "@/lib";
import {
  ApiUserLookupResponse,
  ApiUserResponse,
  UserLookupItem,
  User,
  Leave,
  NewLeave,
  ApiCourseInstructorRecord,
  Term,
  Group,
  InstructorRole,
  Course,
} from "@/types";

export async function lookupUsers(query: string): Promise<UserLookupItem[]> {
  const res = await axios.get<ApiUserLookupResponse>(
    `/api/autocompleter/user?searchType=nameAndInternetId&q=${query}`,
  );
  return res.data.items;
}

export async function getUser(userId: number): Promise<User> {
  const res = await axios.get<ApiUserResponse>(`/api/user/${userId}`);
  return res.data;
}

export async function updateUser(user: User) {
  const res = await axios.put<User>(`/api/user/${user.id}`, user);
  return res.data;
}

export async function createLeave(leave: NewLeave) {
  const res = await axios.post<Leave>(`/api/leaves`, leave);
  return res.data;
}

export async function updateLeave(leave: Leave) {
  const res = await axios.put<Leave>(`/api/leaves/${leave.id}`, leave);
  return res.data;
}

export async function deleteLeave(leaveId: number) {
  const res = await axios.delete(`/api/leaves/${leaveId}`);
  return res.data;
}

export async function getUserLeaves(userId: number): Promise<Leave[]> {
  const res = await axios.get<Leave[]>(`/api/users/${userId}/leaves`);
  return res.data;
}

export async function updateUserLeaves(userId: number, leaves: Leave[]) {
  const res = await axios.put<Leave[]>(`/api/users/${userId}/leaves`, {
    leaves,
  });
  return res.data;
}

let getTermsCache = [] as Term[];
export async function getTerms() {
  if (getTermsCache.length) {
    return getTermsCache;
  }
  const res = await axios.get<Term[]>(`/api/terms`);
  getTermsCache = res.data;
  return res.data;
}

const toCourse = (rawCourse: ApiCourseInstructorRecord): Course => ({
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
  roles: InstructorRole[];
}) {
  const res = await axios.get<ApiCourseInstructorRecord[]>(
    `/api/terms/${termId}/groups/${groupId}/courses`,
    {
      params: {
        includeRoles: roles.length ? roles.join(",") : undefined,
      },
    },
  );

  const coursesByClassNumber = new Map<Course["classNumber"], Course>();

  res.data.forEach((rawCourse) => {
    const course =
      coursesByClassNumber.get(rawCourse.classNumber) ?? toCourse(rawCourse);
    course.instructors.push(rawCourse.instructor);

    coursesByClassNumber.set(rawCourse.classNumber, course);
  });

  return [...coursesByClassNumber.values()];
}

export async function getGroup(groupId: number) {
  const res = await axios.get<Group>(`/api/group/${groupId}`);
  return res.data;
}
