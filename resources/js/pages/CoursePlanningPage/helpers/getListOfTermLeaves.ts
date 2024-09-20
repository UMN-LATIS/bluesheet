import * as T from "@/types";
import { getLeavesInTerm } from "./getLeavesInTerm";
import {
  filterPersonByAcadAppt,
  filterPersonByActiveDeptApptStatus,
} from "./coursePlanningFilters";

export function getListOfTermLeaves({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters: T.CoursePlanningFilters;
}): T.TermLeaves[] {
  return Object.values(lookups.termLookup).map((term) => {
    const leaves = getLeavesInTerm({ lookups, term });

    const filteredLeaves = leaves.filter((leave) => {
      // remove leaves for people with excluded academic appointments
      return (
        filterPersonByAcadAppt(filters)(leave.person) &&
        filterPersonByActiveDeptApptStatus(filters)(leave.person)
      );
    });

    return { term, leaves: filteredLeaves };
  });
}
