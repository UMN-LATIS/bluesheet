import { Course, TimelessCourse } from "@/types";

export function doesCourseNumberMatchSearchTerm(
  course: Course | TimelessCourse,
  searchTerm: string,
) {
  const courseTitle = `${course.subject} ${course.catalogNumber}`.toLowerCase();

  return courseTitle.includes(searchTerm.toLowerCase());
}
