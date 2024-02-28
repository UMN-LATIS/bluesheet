import * as T from "@/types";
import { getJoinedEnrollmentRecord } from "@/utils";
import * as stores from "../../stores";
import { computed } from "vue";

export function getLeavesInTerm({
  leaveLookup,
  term,
}: {
  leaveLookup: Record<T.Leave["id"], T.Leave>;
  term: T.Term;
}) {
  return Object.values(leaveLookup).filter(
    (leave) => leave.termIds?.includes(term.id),
  );
}

export function getEnrollmentsForCourseInTerm({
  course,
  term,
  personLookup,
  enrollmentLookup,
  sectionLookup,
  termLookup,
  courseLookup,
}: {
  course: T.Course;
  term: T.Term;
  personLookup: Record<T.Person["emplid"], T.Person>;
  enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment>;
  sectionLookup: Record<T.CourseSection["id"], T.CourseSection>;
  termLookup: Record<T.Term["id"], T.Term>;
  courseLookup: Record<T.Course["id"], T.Course>;
}): T.JoinedEnrollmentRecord[] {
  return Object.values(enrollmentLookup)
    .map((enrollment) =>
      getJoinedEnrollmentRecord({
        enrollment,
        personLookup,
        sectionLookup,
        termLookup,
        courseLookup,
      }),
    )
    .filter((joinedEnrollment) => {
      const section = sectionLookup[joinedEnrollment.enrollment.sectionId];
      return (
        section && section.courseId === course.id && section.termId === term.id
      );
    });
}

export function getLeavesRow({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters?: T.CoursePlanningFilters;
}): T.LeaveRow {
  const termLeaves = Object.values(lookups.termLookup).map((term) => {
    const leaves = getLeavesInTerm({ leaveLookup: lookups.leaveLookup, term });
    return { term, leaves };
  });
  return ["leaves", ...termLeaves];
}

export interface CourseTableTermRecord {
  term: T.Term;
  joinedEnrollments: T.JoinedEnrollmentRecord[];
}

export type CourseTableRow = [T.Course, ...CourseTableTermRecord[]];

export function getCourseRows({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters?: T.CoursePlanningFilters;
}): CourseTableRow[] {
  const courses = Object.values(lookups.courseLookup);

  return courses.map((course) => {
    const termRecords = Object.values(lookups.termLookup).map((term) => {
      const joinedEnrollments = getEnrollmentsForCourseInTerm({
        course,
        term,
        ...lookups,
      });

      return { term, joinedEnrollments };
    });

    return [course, ...termRecords];
  });
}
export function toCourseSpreadsheetRow(row: CourseTableRow) {
  const [course, ...termRecords] = row;
  return {
    id: course.id,
    title: course.title,
    courseLevel: course.courseLevel,
    courseType: course.courseType,
    ...termRecords.reduce((acc, { term, joinedEnrollments }) => {
      return {
        ...acc,
        [term.name]: joinedEnrollments
          .map(
            (enrollment) =>
              `${enrollment.person.displayName} (${enrollment.person.emplid})`,
          )
          .join(", "),
      };
    }, {}),
  };
}

export function useCourseTableData() {
  const personStore = stores.usePersonStore();
  const courseStore = stores.useCourseStore();
  const termStore = stores.useTermStore();
  const sectionStore = stores.useCourseSectionStore();
  const enrollmentStore = stores.useEnrollmentStore();
  const leaveStore = stores.useLeaveStore();
  const planningStore = stores.useRootCoursePlanningStore();

  const lookups: T.CoursePlanningLookups = {
    // maybe these could have null values I guess? Do we care?
    personLookup: personStore.personLookupByEmpId as Record<
      T.Person["emplid"],
      T.Person
    >,
    courseLookup: courseStore.courseLookup as Record<T.Course["id"], T.Course>,
    termLookup: termStore.termLookup as Record<T.Term["id"], T.Term>,
    sectionLookup: sectionStore.sectionLookup as Record<
      T.CourseSection["id"],
      T.CourseSection
    >,
    enrollmentLookup: enrollmentStore.enrollmentLookup as Record<
      T.Enrollment["id"],
      T.Enrollment
    >,
    leaveLookup: leaveStore.leaveLookup as Record<T.Leave["id"], T.Leave>,
  };

  const leavesRow = computed(() => getLeavesRow({ lookups }));
  const courseRows = computed(() => getCourseRows({ lookups }));
  const courseSpreadsheetRows = computed(() =>
    courseRows.value.map(toCourseSpreadsheetRow),
  );

  return {
    leavesRow,
    courseRows,
    courseSpreadsheetRows,
  };
}
