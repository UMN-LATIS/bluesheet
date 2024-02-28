import * as T from "@/types";
import * as stores from "../../stores";
import { computed, capitalize } from "vue";
import { sortByName, getJoinedEnrollmentRecord } from "@/utils";

export interface PersonTableTermRecord {
  term: T.Term;
  enrollments: T.JoinedEnrollmentRecord[];
  leaves: T.Leave[];
}

export type PersonTableRow = [T.Person, ...PersonTableTermRecord[]];

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

const makeFilterForCourseLevel =
  (filters?: T.CoursePlanningFilters) => (record: T.JoinedEnrollmentRecord) =>
    !(filters?.excludedCourseLevels?.has(record.course.courseLevel) ?? false);

const makeFilterForCourseType =
  (filters?: T.CoursePlanningFilters) => (record: T.JoinedEnrollmentRecord) =>
    !(filters?.excludedCourseTypes?.has(record.course.courseType) ?? false);

const makeFilterForPlanningMode =
  (filters?: T.CoursePlanningFilters) => (record: T.JoinedEnrollmentRecord) => {
    return filters?.inPlanningMode || record.section.isPublished;
  };

const makeFilterForEnrollmentRole =
  (filters?: T.CoursePlanningFilters) => (record: T.JoinedEnrollmentRecord) => {
    return !(
      filters?.excludedEnrollmentRoles?.has(record.enrollment.role) ?? false
    );
  };

const filterRowForAtLeastOneEnrollment = (row: PersonTableRow) => {
  const termRecords = row.slice(1) as PersonTableTermRecord[];
  return termRecords.some((termRecord) => {
    return termRecord.enrollments.length > 0;
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
  filters?: T.CoursePlanningFilters;
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
        getJoinedEnrollmentRecord({
          enrollment,
          courseLookup,
          sectionLookup,
          termLookup,
          personLookup,
        }),
      );

      const allFiltersPass = (record: T.JoinedEnrollmentRecord) =>
        [
          makeFilterForCourseLevel(filters),
          makeFilterForCourseType(filters),
          makeFilterForPlanningMode(filters),
          makeFilterForEnrollmentRole(filters),
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
  return rows.filter(filterRowForAtLeastOneEnrollment);
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
  const planningStore = stores.useRootCoursePlanningStore();

  const lookups = {
    personLookup: personStore.personLookupByEmpId as Record<
      T.Person["emplid"],
      T.Person
    >,
    termLookup: termStore.termLookup as Record<T.Term["id"], T.Term>,
    courseLookup: courseStore.courseLookup as Record<T.Course["id"], T.Course>,
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

  const instructorRows = computed(() => {
    return getTableRows({
      ...lookups,
      filters: {
        ...planningStore.filters,
        excludedEnrollmentRoles: new Set(["TA"]),
        inPlanningMode: planningStore.isInPlanningMode,
      },
    });
  });

  const taRows = computed(() => {
    return getTableRows({
      ...lookups,
      filters: {
        ...planningStore.filters,
        excludedEnrollmentRoles: new Set(["PI"]),
        inPlanningMode: planningStore.isInPlanningMode,
      },
    });
  });

  const instructorSpreadsheetRows = computed(() =>
    instructorRows.value.map(toSpreadsheetRow),
  );

  const taSpreadsheetRows = computed(() => taRows.value.map(toSpreadsheetRow));

  return {
    instructorRows,
    taRows,
    instructorSpreadsheetRows,
    taSpreadsheetRows,
  };
}
