import { axios } from "@/utils";
import * as T from "@/types";

export async function createCourseSectionInGroup({
  course,
  term,
  groupId,
}: {
  course: T.Course;
  term: T.Term;
  groupId: T.Group["id"];
}) {
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

export async function createEnrollmentInGroup({
  person,
  role,
  section,
  groupId,
}: {
  person: T.Person;
  role: T.EnrollmentRole;
  section: T.CourseSection;
  groupId: T.Group["id"];
}): Promise<T.Enrollment> {
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

