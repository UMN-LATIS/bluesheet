import * as T from "@/types";
import { getLeavesInTerm } from "./getLeavesInTerm";

export function getLeavesRow({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters?: T.CoursePlanningFilters;
}): T.LeaveRow {
  const termLeaves = Object.values(lookups.termLookup).map((term) => {
    const leaves = getLeavesInTerm({ lookups, term });
    return { term, leaves };
  });
  return ["leaves", ...termLeaves];
}
