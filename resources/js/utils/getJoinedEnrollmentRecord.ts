import * as T from "@/types";

export function getJoinedEnrollmentRecord({
  enrollment,
  courseLookup,
  sectionLookup,
  termLookup,
  personLookup,
}: {
  enrollment: T.Enrollment;
  courseLookup: Record<T.Course["id"], T.Course>;
  sectionLookup: Record<T.CourseSection["id"], T.CourseSection>;
  termLookup: Record<T.Term["id"], T.Term>;
  personLookup: Record<T.Person["emplid"], T.Person>;
}): T.JoinedEnrollmentRecord {
  const section = sectionLookup[enrollment.sectionId];
  const course = courseLookup[section.courseId];
  const term = termLookup[section.termId];
  const person = personLookup[enrollment.emplid];

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
