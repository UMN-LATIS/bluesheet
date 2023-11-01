import { Course } from "@/types";

export function doesCourseNumberMatchSearchTerm(
  course: Course,
  searchTerm: string,
) {
  const courseTitle = `${course.subject} ${course.catalogNumber}`.toLowerCase();

  return courseTitle.includes(searchTerm.toLowerCase());
}
