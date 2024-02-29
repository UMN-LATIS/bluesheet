import * as T from "@/types";

export function getLeavesInTerm({
  lookups,
  term,
}: {
  lookups: Pick<
    T.CoursePlanningLookups,
    "leaveLookup" | "personLookupByUserId"
  >;
  term: T.Term;
}): T.LeaveWithPerson[] {
  const leaves = Object.values(lookups.leaveLookup).filter(
    (leave) => leave.termIds?.includes(term.id),
  );

  const leavesWithPerson: T.LeaveWithPerson[] = leaves.map((leave) => {
    const person = lookups.personLookupByUserId[leave.user_id];
    return { ...leave, person };
  });

  return leavesWithPerson;
}
