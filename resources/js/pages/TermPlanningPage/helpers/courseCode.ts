import type { PlannableCourse } from "../types";

/** A subject and a catalog number, as a scheduler types them into the picker. */
export interface CourseCodeParts {
  subject: string;
  catalogNumber: string;
}

const CODE = /^([A-Za-z]{2,8})[\s-]*([0-9][0-9A-Za-z]{0,7})$/;

/**
 * Reads "psy 5099", "PSY-5099" and "PSY5099" the same way, so a scheduler
 * naming a course does not have to guess this department's punctuation.
 * Null for anything that is not a subject followed by a catalog number.
 */
export function parseCourseCode(text: string): CourseCodeParts | null {
  const match = CODE.exec(text.trim());
  if (!match) return null;

  return {
    subject: match[1].toUpperCase(),
    catalogNumber: match[2].toUpperCase(),
  };
}

export const courseCodeOf = ({ subject, catalogNumber }: CourseCodeParts) =>
  `${subject}-${catalogNumber}`;

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
