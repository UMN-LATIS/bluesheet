import * as T from "@/types";
import { sortByName } from "@/utils";
import { getLeavesForPersonInTerm } from "./getLeavesForPersonInTerm";
import { getEnrollmentsForPersonInTerm } from "./getEnrollmentsForPersonInTerm";
import { getJoinedEnrollmentRecord } from "./getJoinedEnrollmentRecord";
import {
  allEnrollmentFiltersPass,
  filterPersonByAcadAppt,
  filterPersonTableRowForAtLeastOneEnrollment,
  filterTermByStartAndEndTerm,
} from "./coursePlanningFilters";

export function getPersonTableRows({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters: T.CoursePlanningFilters;
}): T.PersonTableRow[] {
  const sortedPeople = Object.values(lookups.personLookupByEmplid).sort(
    sortByName,
  );
  const sortedTerms = Object.values(lookups.termLookup).sort(
    (a, b) => a.id - b.id,
  );

  const filteredPeople = sortedPeople.filter(filterPersonByAcadAppt(filters));

  const filteredTerms = sortedTerms.filter(
    filterTermByStartAndEndTerm(filters),
  );

  const rows: T.PersonTableRow[] = filteredPeople.map((person) => {
    const termRecords = filteredTerms.map((term) => {
      const filteredEnrollmentRecords = getEnrollmentsForPersonInTerm({
        person,
        term,
        lookups,
      })
        // join with other data
        .map((enrollment) =>
          getJoinedEnrollmentRecord({
            enrollment,
            lookups,
          }),
        )
        // exclude records that don't pass all filters
        .filter(allEnrollmentFiltersPass(filters));

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
  return rows.filter(filterPersonTableRowForAtLeastOneEnrollment);
}
