import type { PlannableCourse } from "../types";

/**
 * Courses whose code, title, or the two together contain everything typed.
 * Terms are matched separately so that "psy intro" finds Intro Psych, which a
 * single substring search over either field alone would miss.
 */
export function searchCourses(
  courses: PlannableCourse[],
  text: string,
): PlannableCourse[] {
  const terms = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return courses;

  return courses.filter((course) => {
    const haystack =
      `${course.subject} ${course.catalogNumber} ${course.courseCode} ${course.title}`.toLowerCase();

    return terms.every((term) => haystack.includes(term));
  });
}
