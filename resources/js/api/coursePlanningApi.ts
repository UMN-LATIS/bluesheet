import { axios } from "@/utils";
import * as T from "@/types";

export async function fetchCoursesForGroup(groupId: number) {
  const res = await axios.get<T.Course[]>(
    `/api/course-planning/groups/${groupId}/courses`,
  );
  return res.data;
}

export async function fetchCourseSectionsForGroup(groupId: number) {
  const res = await axios.get<T.CourseSection[]>(
    `/api/course-planning/groups/${groupId}/sections`,
  );
  return res.data;
}

export async function fetchEnrollmentsForGroup(groupId: number) {
  const res = await axios.get<T.Enrollment[]>(
    `/api/course-planning/groups/${groupId}/enrollments`,
  );
  return res.data;
}

export async function fetchPeopleForGroup(groupId: number) {
  const res = await axios.get<T.Person[]>(
    `/api/course-planning/groups/${groupId}/people`,
  );
  return res.data;
}

export async function fetchLeavesForGroup(groupId: number) {
  const res = await axios.get<T.Leave[]>(
    `/api/course-planning/groups/${groupId}/leaves`,
  );
  return res.data;
}
