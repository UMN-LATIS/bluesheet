import * as T from "@/types";
import { getJoinedEnrollmentRecord } from "./getJoinedEnrollmentRecord";
import { isNotNullish } from "@/utils/isNotNullish";

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
    .map((enrollment) => {
      // if a person is not in the person lookup, then we can't join the enrollment and so we skip it
      try {
        return getJoinedEnrollmentRecord({
          enrollment,
          lookups,
        });
      } catch (e) {
        return null;
      }
    })
    .filter(isNotNullish)
    .filter((joinedEnrollment) => {
      const section =
        lookups.sectionLookup[joinedEnrollment.enrollment.sectionId];
      return (
        section && section.courseId === course.id && section.termId === term.id
      );
    });
}
