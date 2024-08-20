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
  const person = lookups.personLookupByEmplid[enrollment.emplid] ?? null;

  if (!section || !course || !term || !person) {
    throw new Error("Missing data for enrollment record");
  }

  return {
    id: enrollment.id,
    person,
    enrollment,
    section,
    course,
    term,
  };
}
