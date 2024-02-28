import * as T from "@/types";
import { getLeavesInTerm } from "./getLeavesInTerm";

export function getTermsWithLeaves({
  lookups,
  filters,
}: {
  lookups: T.CoursePlanningLookups;
  filters?: T.CoursePlanningFilters;
}): T.TermLeaves[] {
  return Object.values(lookups.termLookup).map((term) => {
    const leaves = getLeavesInTerm({ lookups, term });
    return { term, leaves };
  });
}
