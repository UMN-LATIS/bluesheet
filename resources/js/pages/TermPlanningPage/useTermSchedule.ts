/**
 * What the SIS has for one department in one term: which term the page is on,
 * whether that term still takes edits, the department's own people, and its
 * sections. Nothing here knows about this browser's unsaved edits or about the
 * filters; the page lays those over the top.
 */

import { computed, type Ref } from "vue";
import dayjs from "dayjs";
import { currentTerm } from "./helpers/currentTerm";
import { isTermReadOnly } from "./helpers/termLock";
import { useSisEmployeesQuery } from "./queries/useSisEmployeesQuery";
import { useSisSectionsQuery } from "./queries/useSisSectionsQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";

export function useTermSchedule(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const today = computed(() => dayjs().format("YYYY-MM-DD"));

  const termsQuery = useSisTermsQuery();

  /** The term the URL names, or failing that the one we are in today. */
  const term = computed(() => {
    const terms = termsQuery.data.value ?? [];

    return termCode.value === null
      ? currentTerm(terms, today.value)
      : (terms.find(({ id }) => id === termCode.value) ?? null);
  });

  /** Newest first, since planning looks forward. */
  const termOptions = computed(() =>
    [...(termsQuery.data.value ?? [])].sort((a, b) => b.id - a.id),
  );

  const employeesQuery = useSisEmployeesQuery(groupId);

  const sectionsQuery = useSisSectionsQuery(
    groupId,
    computed(() => term.value?.id ?? null),
  );

  return {
    today,
    term,
    termOptions,
    /** Everything read-only on this page hangs off this one value. */
    isReadOnly: computed(() => isTermReadOnly(term.value, today.value)),
    /** Who a section can be assigned to: the department's own people. */
    roster: computed(() => employeesQuery.data.value ?? []),
    /** The term's sections as the SIS sent them, before any local edit. */
    sections: computed(() => sectionsQuery.data.value ?? []),
  };
}
