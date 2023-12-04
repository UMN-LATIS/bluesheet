import { axios } from "@/utils";
import * as T from "./coursePlanningTypes";
import { Leave } from "@/types";

export async function getGroup(groupId: number) {
  const res = await axios.get<T.ApiGetGroupCoursePlanningResponse>(
    `/api/course-planning/groups/${groupId}`,
  );
  return res.data;
}

export async function fetchCourses(groupId: number) {
  const res = await axios.get<T.Course[]>(
    `/api/course-planning/groups/${groupId}/courses`,
  );
  return res.data;
}

export async function fetchCourseSections(groupId: number) {
  const res = await axios.get<T.CourseSection[]>(
    `/api/course-planning/groups/${groupId}/sections`,
  );
  return res.data;
}

export async function fetchEnrollments(
  groupId: number,
  roles: T.EnrollmentRole[] = [],
) {
  const params = new URLSearchParams();

  if (roles.length > 0) {
    params.append("includeRoles", roles.join(","));
  }

  const res = await axios.get<T.Enrollment[]>(
    `/api/course-planning/groups/${groupId}/enrollments`,
    { params },
  );
  return res.data;
}

export async function fetchPeople(groupId: number) {
  const res = await axios.get<T.Person[]>(
    `/api/course-planning/groups/${groupId}/people`,
  );
  return res.data;
}

export async function fetchLeaves(groupId: number) {
  const res = await axios.get<Leave[]>(
    `/api/course-planning/groups/${groupId}/leaves`,
  );
  return res.data;
}
