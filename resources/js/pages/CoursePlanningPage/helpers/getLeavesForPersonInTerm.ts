import * as T from "@/types";

export function getLeavesForPersonInTerm({
  lookups,
  person,
  term,
}: {
  lookups: Pick<T.CoursePlanningLookups, "leaveLookup">;
  person: T.Person;
  term: T.Term;
}) {
  return Object.values(lookups.leaveLookup).filter(
    (leave) => leave.user_id === person.id && leave.termIds?.includes(term.id),
  );
}
