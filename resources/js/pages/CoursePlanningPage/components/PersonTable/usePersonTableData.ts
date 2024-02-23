import * as T from "@/types";
import * as stores from "../../stores";
import { computed, capitalize } from "vue";
import { sortByName } from "@/utils";
import { filter } from "lodash";

export interface PersonTableTermRecord {
  term: T.Term;
  enrollments: JoinedEnrollmentRecord[];
  leaves: T.Leave[];
}

export interface JoinedEnrollmentRecord {
  person: T.Person;
  enrollment: T.Enrollment;
  section: T.CourseSection;
  course: T.Course;
  term: T.Term;
}

export type PersonTableRow = [T.Person, ...PersonTableTermRecord[]];

interface TableFilters {
  excludedCourseLevels?: Set<string>;
  excludedCourseTypes?: Set<string>;
  excludedAcadAppts?: Set<string>;
  excludedEnrollmentRoles?: Set<T.EnrollmentRole>;
  startTermId?: number | null;
  endTermId?: number | null;
  inPlanningMode?: boolean;
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

const filterRecordForCourseLevel =
  (filters?: TableFilters) => (record: JoinedEnrollmentRecord) =>
    !(filters?.excludedCourseLevels?.has(record.course.courseLevel) ?? false);

const filterRecordForCourseType =
  (filters?: TableFilters) => (record: JoinedEnrollmentRecord) =>
    !(filters?.excludedCourseTypes?.has(record.course.courseType) ?? false);

const filterRecordForPlanningMode =
  (filters?: TableFilters) => (record: JoinedEnrollmentRecord) => {
    return filters?.inPlanningMode || record.section.isPublished;
  };

const filterRecordForEnrollmentRole =
  (filters?: TableFilters) => (record: JoinedEnrollmentRecord) => {
    return !(
      filters?.excludedEnrollmentRoles?.has(record.enrollment.role) ?? false
    );
  };

const filterRowForEnrollmentsOrLeaves = (row: PersonTableRow) => {
  const termRecords = row.slice(1) as PersonTableTermRecord[];
  return termRecords.some((termRecord) => {
    return termRecord.enrollments.length > 0 || termRecord.leaves.length > 0;
  });
};

export function getTableRows({
  personLookup,
  termLookup,
  courseLookup,
  sectionLookup,
  enrollmentLookup,
  leaveLookup,
  filters,
}: {
  personLookup: Record<T.Person["emplid"], T.Person>;
  termLookup: Record<T.Term["id"], T.Term>;
  courseLookup: Record<T.Course["id"], T.Course>;
  sectionLookup: Record<T.CourseSection["id"], T.CourseSection>;
  enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment>;
  leaveLookup: Record<T.Leave["id"], T.Leave>;
  filters?: TableFilters;
}): PersonTableRow[] {
  const sortedPeople = Object.values(personLookup).sort(sortByName);
  const sortedTerms = Object.values(termLookup).sort((a, b) => a.id - b.id);

  const filteredPeople = sortedPeople.filter((person) => {
    return !(
      filters?.excludedAcadAppts?.has(person.academicAppointment) ?? false
    );
  });

  const filteredTerms = sortedTerms.filter((term) => {
    const isBeforeStartTerm =
      filters?.startTermId && term.id < filters.startTermId;
    const isAfterEndTerm = filters?.endTermId && term.id > filters.endTermId;

    return !isBeforeStartTerm && !isAfterEndTerm;
  });

  const rows: PersonTableRow[] = filteredPeople.map((person) => {
    const termRecords = Object.values(filteredTerms).map((term) => {
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

      const allFiltersPass = (record: JoinedEnrollmentRecord) =>
        [
          filterRecordForCourseLevel(filters),
          filterRecordForCourseType(filters),
          filterRecordForPlanningMode(filters),
          filterRecordForEnrollmentRole(filters),
        ].every((filter) => filter(record));

      const filteredEnrollmentRecords =
        personEnrollmentsInTerm.filter(allFiltersPass);

      const personLeavesInTerm = getLeavesForPersonInTerm(
        leaveLookup,
        person,
        term,
      );

      return {
        term,
        enrollments: filteredEnrollmentRecords,
        leaves: personLeavesInTerm,
      };
    });

    return [person, ...termRecords];
  });

  // remove rows with no enrollments or leaves
  return rows.filter(filterRowForEnrollmentsOrLeaves);
}

export function toSpreadsheetRow(row: PersonTableRow) {
  const [person, ...termRecords] = row;

  return {
    id: person.emplid,
    surName: person.surName,
    givenName: person.givenName,
    academicAppointment: person.academicAppointment,
    ...termRecords.reduce((acc, termRecord) => {
      return {
        ...acc,
        [termRecord.term.name]: [
          ...termRecord.leaves.map((leave) =>
            capitalize(`${leave.type} Leave (${leave.status})`),
          ),
          ...termRecord.enrollments.map((enrollment) => enrollment.course.id),
        ].join(", "),
      };
    }, {}),
  };
}

export function usePersonTableData() {
  const personStore = stores.usePersonStore();
  const termStore = stores.useTermStore();
  const courseStore = stores.useCourseStore();
  const sectionStore = stores.useCourseSectionStore();
  const enrollmentStore = stores.useEnrollmentStore();
  const leaveStore = stores.useLeaveStore();
  const filterStore = stores.useRootCoursePlanningStore();

  const rows = computed(() => {
    return getTableRows({
      personLookup: personStore.personLookupByEmpId as Record<
        T.Person["emplid"],
        T.Person
      >,
      termLookup: termStore.termLookup,
      courseLookup: courseStore.courseLookup as Record<
        T.Course["id"],
        T.Course
      >,
      sectionLookup: sectionStore.sectionLookup as Record<
        T.CourseSection["id"],
        T.CourseSection
      >,
      enrollmentLookup: enrollmentStore.enrollmentLookup as Record<
        T.Enrollment["id"],
        T.Enrollment
      >,
      leaveLookup: leaveStore.leaveLookup,
      filters: filterStore.filters,
    });
  });

  const spreadsheetJson = computed(() => rows.value.map(toSpreadsheetRow));

  return {
    rows,
    spreadsheetJson,
  };
}
