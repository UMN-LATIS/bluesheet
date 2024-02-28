import * as T from "@/types";

export function getJoinedEnrollmentRecord({
  enrollment,
  lookups,
}: {
  enrollment: T.Enrollment;
  lookups: T.CoursePlanningLookups;
}): T.JoinedEnrollmentRecord {
  const section = lookups.sectionLookup[enrollment.sectionId];
  const course = lookups.courseLookup[section.courseId];
  const term = lookups.termLookup[section.termId];
  const person = lookups.personLookup[enrollment.emplid] ?? null;

  if (!section || !course || !term || !person) {
    throw new Error("Missing data for enrollment record");
  }

  return {
    person,
    enrollment,
    section,
    course,
    term,
  };
}
