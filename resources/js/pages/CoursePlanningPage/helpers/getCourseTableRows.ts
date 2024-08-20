import * as T from "@/types";
import { getEnrollmentsForCourseInTerm } from "./getEnrollmentsForCourseInTerm";
import {
  filterCourseByCourseLevel,
  filterCourseByCourseType,
  filterCourseTableRowForAtLeastOneEnrollment,
  filterTermByStartAndEndTerm,
  allEnrollmentFiltersPass,
} from "./coursePlanningFilters";
export function getCourseTableRows({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters: T.CoursePlanningFilters;
}): T.CourseTableRow[] {
  const sortedCourses = Object.values(lookups.courseLookup).sort((a, b) =>
    a.courseCode.localeCompare(b.courseCode),
  );

  const sortedTerms = Object.values(lookups.termLookup).sort(
    (a, b) => a.id - b.id,
  );

  const filteredCourses = sortedCourses.filter((course) => {
    return (
      filterCourseByCourseLevel(filters)(course) &&
      filterCourseByCourseType(filters)(course)
    );
  });

  const filteredTerms = sortedTerms.filter(
    filterTermByStartAndEndTerm(filters),
  );

  const rows: T.CourseTableRow[] = filteredCourses.map((course) => {
    const termRecords = filteredTerms.map((term) => {
      const filteredEnrollments = getEnrollmentsForCourseInTerm({
        course,
        term,
        lookups,
      }).filter(allEnrollmentFiltersPass(filters));

      return {
        term,
        joinedEnrollments: filteredEnrollments,
      };
    });

    return [course, ...termRecords];
  });

  // remove rows with no enrollments
  return rows.filter(filterCourseTableRowForAtLeastOneEnrollment);
}
