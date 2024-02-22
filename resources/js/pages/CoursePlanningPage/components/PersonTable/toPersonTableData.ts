import * as T from "@/types";
export interface PersonTableTermRecord {
  term: T.Term;
  enrollments: JoinedEnrollmentRecord[];
  leaves: T.Leave[];
}

export interface PersonTableRecord {
  id: T.Person["emplid"];
  person: T.Person;
  termRecords: PersonTableTermRecord[];
}

export interface JoinedEnrollmentRecord {
  person: T.Person;
  enrollment: T.Enrollment;
  section: T.CourseSection;
  course: T.Course;
  term: T.Term;
}

function joinEnrollmentRecord({
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
}): JoinedEnrollmentRecord {
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

function getLeavesForPersonInTerm(
  leaveLookup: Record<T.Leave["id"], T.Leave>,
  person: T.Person,
  term: T.Term,
) {
  return Object.values(leaveLookup).filter(
    (leave) => leave.user_id === person.id && leave.termIds?.includes(term.id),
  );
}

function getEnrollmentsForPersonInTerm({
  person,
  term,
  enrollmentLookup,
  sectionLookup,
}: {
  person: T.Person;
  term: T.Term;
  enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment>;
  sectionLookup: Record<T.CourseSection["id"], T.CourseSection>;
}): T.Enrollment[] {
  return Object.values(enrollmentLookup).filter((enrollment) => {
    const section = sectionLookup[enrollment.sectionId];

    return (
      section &&
      enrollment.emplid === person.emplid &&
      section.termId === term.id
    );
  });
}

export function toPersonTableData({
  personLookup,
  termLookup,
  courseLookup,
  sectionLookup,
  enrollmentLookup,
  leaveLookup,
}: {
  personLookup: Record<T.Person["emplid"], T.Person>;
  termLookup: Record<T.Term["id"], T.Term>;
  courseLookup: Record<T.Course["id"], T.Course>;
  sectionLookup: Record<T.CourseSection["id"], T.CourseSection>;
  enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment>;
  leaveLookup: Record<T.Leave["id"], T.Leave>;
}): PersonTableRecord[] {
  const allPeople = Object.values(personLookup);
  const sortedTerms = Object.values(termLookup).sort((a, b) => b.id - a.id);

  return allPeople.map((person) => {
    const termRecords = Object.values(sortedTerms).map((term) => {
      const personEnrollmentsInTerm = getEnrollmentsForPersonInTerm({
        person,
        term,
        enrollmentLookup,
        sectionLookup,
      }).map((enrollment) =>
        // join with other data
        joinEnrollmentRecord({
          enrollment,
          courseLookup,
          sectionLookup,
          termLookup,
          personLookup,
        }),
      );

      const personeLeavesInTerm = getLeavesForPersonInTerm(
        leaveLookup,
        person,
        term,
      );

      return {
        term,
        enrollments: personEnrollmentsInTerm,
        leaves: personeLeavesInTerm,
      };
    });

    return {
      id: person.emplid,
      person,
      termRecords,
    };
  });
}
