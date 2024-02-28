import * as T from "@/types";
import { getJoinedEnrollmentRecord } from "./getJoinedEnrollmentRecord";

export function getEnrollmentsForCourseInTerm({
  course,
  term,
  lookups,
}: {
  course: T.Course;
  term: T.Term;
  lookups: T.CoursePlanningLookups;
}): T.JoinedEnrollmentRecord[] {
  return Object.values(lookups.enrollmentLookup)
    .map((enrollment) =>
      getJoinedEnrollmentRecord({
        enrollment,
        lookups,
      }),
    )
    .filter((joinedEnrollment) => {
      const section =
        lookups.sectionLookup[joinedEnrollment.enrollment.sectionId];
      return (
        section && section.courseId === course.id && section.termId === term.id
      );
    });
}
