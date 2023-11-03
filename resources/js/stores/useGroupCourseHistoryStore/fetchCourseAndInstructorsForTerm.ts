import type * as Types from "@/types";
import * as api from "@/api";

/**
 * for a given term, get the list of leaves for the instructor
 */
export async function fetchCoursesAndInstructorsForTerm(
  groupId: Types.Group["id"],
  termId: Types.Term["id"],
) {
  const instructorsByCourseAndTermMap: Types.InstructorsByCourseTermMap =
    new Map();
  const coursesByInstructorAndTermMap: Types.CoursesByInstructorTermMap =
    new Map();

  const courses = await api.getGroupCoursesByTerm({
    groupId,
    termId,
    roles: ["PI", "TA"],
  });

  courses.forEach((course) => {
    const courseAndTermKey: Types.InstructorsByCourseAndTermKey = `${course.shortCode}-${termId}`;
    const existingInstructors =
      instructorsByCourseAndTermMap.get(courseAndTermKey) ?? [];

    // tuck the course into the instructor object so that we can use
    // specific course info like enrollment or class number
    const instructorsWithCourse = course.instructors.map((instructor) => {
      return {
        ...instructor,
        course,
      };
    });

    instructorsByCourseAndTermMap.set(courseAndTermKey, [
      ...existingInstructors,
      ...instructorsWithCourse,
    ]);
    course.instructors.forEach((instructor) => {
      const instructorAndTermKey: Types.CoursesByInstructorAndTermKey = `${instructor.id}-${termId}`;
      const existingCourses =
        coursesByInstructorAndTermMap.get(instructorAndTermKey) ?? [];
      coursesByInstructorAndTermMap.set(instructorAndTermKey, [
        ...existingCourses,
        course,
      ]);
    });
  });

  return { coursesByInstructorAndTermMap, instructorsByCourseAndTermMap };
}
