import * as T from "@/types";
import { getLeavesInTerm } from "./getLeavesInTerm";
import { filterPersonByAcadAppt } from "./coursePlanningFilters";

export function getListOfTermLeaves({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters: T.CoursePlanningFilters;
}): T.TermLeaves[] {
  return Object.values(lookups.termLookup).map((term) => {
    const leaves = getLeavesInTerm({ lookups, term });

    // remove leaves for people with excluded academic appointments
    const filteredLeaves = leaves.filter((leave) => {
      return filterPersonByAcadAppt(filters)(leave.person);
    });

    return { term, leaves: filteredLeaves };
  });
}
