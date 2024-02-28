import * as T from "@/types";

export const makeFilterForCourseLevel =
  (filters: Pick<T.CoursePlanningFilters, "excludedCourseLevels">) =>
  (record: T.JoinedEnrollmentRecord) =>
    !filters.excludedCourseLevels.has(record.course.courseLevel);

export const makeFilterForCourseType =
  (filters: Pick<T.CoursePlanningFilters, "excludedCourseTypes">) =>
  (record: T.JoinedEnrollmentRecord) =>
    !filters.excludedCourseTypes.has(record.course.courseType);

export const makeFilterForPlanningMode =
  (filters: Pick<T.CoursePlanningFilters, "inPlanningMode">) =>
  (record: T.JoinedEnrollmentRecord) =>
    filters.inPlanningMode || record.section.isPublished;

export const makeFilterForEnrollmentRole =
  (filters: Pick<T.CoursePlanningFilters, "includedEnrollmentRoles">) =>
  (record: T.JoinedEnrollmentRecord) =>
    filters.includedEnrollmentRoles.has(record.enrollment.role);

export const personTableRowHasAtLeaveOneEnrollment = (
  row: T.PersonTableRow,
) => {
  const termRecords = row.slice(1) as T.PersonTableTermRecord[];
  return termRecords.some((termRecord) => {
    return termRecord.enrollments.length > 0;
  });
};
