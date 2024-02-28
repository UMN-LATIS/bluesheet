import * as T from "@/types";

export const makeFilterForCourseLevel =
  (filters?: T.CoursePlanningFilters) => (record: T.JoinedEnrollmentRecord) =>
    !(filters?.excludedCourseLevels?.has(record.course.courseLevel) ?? false);

export const makeFilterForCourseType =
  (filters?: T.CoursePlanningFilters) => (record: T.JoinedEnrollmentRecord) =>
    !(filters?.excludedCourseTypes?.has(record.course.courseType) ?? false);

export const makeFilterForPlanningMode =
  (filters?: T.CoursePlanningFilters) => (record: T.JoinedEnrollmentRecord) => {
    return filters?.inPlanningMode || record.section.isPublished;
  };

export const makeFilterForEnrollmentRole =
  (filters?: T.CoursePlanningFilters) => (record: T.JoinedEnrollmentRecord) => {
    return !(
      filters?.excludedEnrollmentRoles?.has(record.enrollment.role) ?? false
    );
  };

export const personTableRowHasAtLeaveOneEnrollment = (
  row: T.PersonTableRow,
) => {
  const termRecords = row.slice(1) as T.PersonTableTermRecord[];
  return termRecords.some((termRecord) => {
    return termRecord.enrollments.length > 0;
  });
};
