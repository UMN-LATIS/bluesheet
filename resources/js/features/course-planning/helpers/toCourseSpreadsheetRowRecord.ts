import * as T from "@/types";

export function toCourseSpreadsheetRowRecord(
  row: T.CourseTableRow,
): T.CourseSpreadsheetRowRecord {
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
