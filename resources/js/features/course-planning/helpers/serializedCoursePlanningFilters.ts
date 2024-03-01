import * as T from "@/types";

export function serializedCoursePlanningFilters(
  filters: T.CoursePlanningFilters,
): T.SerializedCoursePlanningFilters {
  return {
    ...filters,
    // serialized sets to arrays
    excludedCourseLevels: Array.from(filters.excludedCourseLevels),
    excludedCourseTypes: Array.from(filters.excludedCourseTypes),
    excludedAcadAppts: Array.from(filters.excludedAcadAppts),
    includedEnrollmentRoles: Array.from(filters.includedEnrollmentRoles),
  };
}

export function deserializeCoursePlanningFilters(
  filters: T.SerializedCoursePlanningFilters,
): T.CoursePlanningFilters {
  return {
    ...filters,
    // deserialized arrays to sets
    excludedCourseLevels: new Set(filters.excludedCourseLevels),
    excludedCourseTypes: new Set(filters.excludedCourseTypes),
    excludedAcadAppts: new Set(filters.excludedAcadAppts),
    includedEnrollmentRoles: new Set(filters.includedEnrollmentRoles),
  };
}
