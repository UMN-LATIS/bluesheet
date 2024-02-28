import * as T from "@/types";

export function getLeavesInTerm({
  lookups,
  term,
}: {
  lookups: Pick<T.CoursePlanningLookups, "leaveLookup">;
  term: T.Term;
}) {
  return Object.values(lookups.leaveLookup).filter(
    (leave) => leave.termIds?.includes(term.id),
  );
}
