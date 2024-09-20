import * as T from "@/types";

export const filterCourseByCourseLevel =
  (filters: Pick<T.CoursePlanningFilters, "excludedCourseLevels">) =>
  (course: T.Course) => {
    return !filters.excludedCourseLevels.has(course.courseLevel);
  };

export const filterCourseByCourseType =
  (filters: Pick<T.CoursePlanningFilters, "excludedCourseTypes">) =>
  (course: T.Course) => {
    return !filters.excludedCourseTypes.has(course.courseType);
  };

export const filterSectionByPublishStateWhenNotInPlanningMode =
  (filters: Pick<T.CoursePlanningFilters, "inPlanningMode">) =>
  (section: T.CourseSection) => {
    return filters.inPlanningMode || section.isPublished;
  };

export const filterPersonByAcadAppt =
  (filters: T.CoursePlanningFilters) => (person: T.Person) => {
    return !(
      filters?.excludedAcadAppts?.has(person.academicAppointment) ?? false
    );
  };

export const filterPersonByActiveDeptApptStatus =
  (filters: T.CoursePlanningFilters) => (person: T.Person) => {
    if (filters.onlyActiveAppointments) {
      return person.hasActiveDeptAppointment;
    }
    return true;
  };

export const filterEnrollmentByRole =
  (filters: Pick<T.CoursePlanningFilters, "includedEnrollmentRoles">) =>
  (enrollment: T.Enrollment) => {
    return filters.includedEnrollmentRoles.has(enrollment.role);
  };

export const allEnrollmentFiltersPass =
  (filters: T.CoursePlanningFilters) =>
  (enrollment: T.JoinedEnrollmentRecord) => {
    return (
      filterCourseByCourseLevel(filters)(enrollment.course) &&
      filterCourseByCourseType(filters)(enrollment.course) &&
      filterSectionByPublishStateWhenNotInPlanningMode(filters)(
        enrollment.section,
      ) &&
      filterEnrollmentByRole(filters)(enrollment.enrollment)
    );
  };

export const filterPersonTableRowForAtLeastOneEnrollment = (
  row: T.PersonTableRow,
) => {
  const termRecords = row.slice(1) as T.PersonTableTermRecord[];
  return termRecords.some((termRecord) => {
    return termRecord.enrollments.length > 0;
  });
};

export const filterTermByStartAndEndTerm =
  (filters: Pick<T.CoursePlanningFilters, "startTermId" | "endTermId">) =>
  (term: T.Term) => {
    const isBeforeStartTerm =
      filters?.startTermId && term.id < filters.startTermId;
    const isAfterEndTerm = filters?.endTermId && term.id > filters.endTermId;

    return !isBeforeStartTerm && !isAfterEndTerm;
  };

export const filterCourseTableRowForAtLeastOneEnrollment = (
  row: T.CourseTableRow,
) => {
  const termRecords = row.slice(1) as T.CourseTableTermRecord[];
  return termRecords.some((termRecord) => {
    return termRecord.joinedEnrollments.length > 0;
  });
};
