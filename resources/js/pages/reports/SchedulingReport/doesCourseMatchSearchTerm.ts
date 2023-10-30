import { ApiCourseInstructorRecord } from "@/types";

export function doesCourseMatchSearchTerm(
  course: ApiCourseInstructorRecord,
  searchTerm: string,
) {
  const courseTitle =
    `${course.subject} ${course.catalogNumber} ${course.classSection}`.toLowerCase();

  return courseTitle.includes(searchTerm.toLowerCase());
}
