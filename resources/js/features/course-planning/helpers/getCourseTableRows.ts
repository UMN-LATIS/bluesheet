import * as T from "@/types";
import { getEnrollmentsForCourseInTerm } from "./getEnrollmentsForCourseInTerm";

export function getCourseTableRows({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters?: T.CoursePlanningFilters;
}): T.CourseTableRow[] {
  const courses = Object.values(lookups.courseLookup);

  return courses.map((course) => {
    const termRecords = Object.values(lookups.termLookup).map((term) => {
      const joinedEnrollments = getEnrollmentsForCourseInTerm({
        course,
        term,
        lookups,
      });

      return { term, joinedEnrollments };
    });

    return [course, ...termRecords];
  });
}
