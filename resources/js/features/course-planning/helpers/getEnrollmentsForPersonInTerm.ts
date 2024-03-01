import * as T from "@/types";

export function getEnrollmentsForPersonInTerm({
  person,
  term,
  lookups,
}: {
  person: T.Person;
  term: T.Term;
  lookups: Pick<T.CoursePlanningLookups, "enrollmentLookup" | "sectionLookup">;
}): T.Enrollment[] {
  return Object.values(lookups.enrollmentLookup).filter((enrollment) => {
    const section = lookups.sectionLookup[enrollment.sectionId];

    return (
      section &&
      enrollment.emplid === person.emplid &&
      section.termId === term.id
    );
  });
}
