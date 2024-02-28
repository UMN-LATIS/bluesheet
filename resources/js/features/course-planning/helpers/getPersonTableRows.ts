import * as T from "@/types";
import { sortByName } from "@/utils";
import { getLeavesForPersonInTerm } from "./getLeavesForPersonInTerm";
import { getEnrollmentsForPersonInTerm } from "./getEnrollmentsForPersonInTerm";
import { getJoinedEnrollmentRecord } from "./getJoinedEnrollmentRecord";
import {
  makeFilterForCourseLevel,
  makeFilterForCourseType,
  makeFilterForEnrollmentRole,
  makeFilterForPlanningMode,
  personTableRowHasAtLeaveOneEnrollment,
} from "./makeCoursePlanningFilters";

export function getPersonTableRows({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters: T.CoursePlanningFilters;
}): T.PersonTableRow[] {
  const sortedPeople = Object.values(lookups.personLookup).sort(sortByName);
  const sortedTerms = Object.values(lookups.termLookup).sort(
    (a, b) => a.id - b.id,
  );

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

  const rows: T.PersonTableRow[] = filteredPeople.map((person) => {
    const termRecords = Object.values(filteredTerms).map((term) => {
      const personEnrollmentsInTerm = getEnrollmentsForPersonInTerm({
        person,
        term,
        lookups,
      }).map((enrollment) =>
        // join with other data
        getJoinedEnrollmentRecord({
          enrollment,
          lookups,
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

      const personLeavesInTerm = getLeavesForPersonInTerm({
        person,
        term,
        lookups,
      });

      return {
        term,
        enrollments: filteredEnrollmentRecords,
        leaves: personLeavesInTerm,
      };
    });

    return [person, ...termRecords];
  });

  // remove rows with no enrollments or leaves
  return rows.filter(personTableRowHasAtLeaveOneEnrollment);
}
