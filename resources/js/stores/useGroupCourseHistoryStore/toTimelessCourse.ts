import type * as Types from "@/types";

export function toTimelessCourse(course: Types.Course): Types.TimelessCourse {
  return {
    shortCode: `${course.subject}-${course.catalogNumber}`,
    subject: course.subject,
    catalogNumber: course.catalogNumber,
    title: course.title,
    courseType: course.courseType,
    courseLevel: course.courseLevel,
  };
}
