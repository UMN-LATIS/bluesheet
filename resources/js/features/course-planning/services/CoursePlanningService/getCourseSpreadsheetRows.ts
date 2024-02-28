import * as T from "@/types";
import { getCourseTableRows } from "./getCourseTableRows";

export function toCourseSpreadsheetRow(row: T.CourseTableRow) {
  const [course, ...termRecords] = row;
  return {
    id: course.id,
    title: course.title,
    courseLevel: course.courseLevel,
    courseType: course.courseType,
    ...termRecords.reduce((acc, { term, joinedEnrollments }) => {
      return {
        ...acc,
        [term.name]: joinedEnrollments
          .map(
            (enrollment) =>
              `${enrollment.person.displayName} (${enrollment.person.emplid})`,
          )
          .join(", "),
      };
    }, {}),
  };
}

export function getCourseSpreadsheetRows({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters?: T.CoursePlanningFilters;
}) {
  const courseRows = getCourseTableRows({ lookups, filters });
  return courseRows.map(toCourseSpreadsheetRow);
}
