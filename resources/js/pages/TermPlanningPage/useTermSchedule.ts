/**
 * One department's schedule for one term: which term the page is on, who owns
 * that term, the department's own people, and its sections.
 *
 * A term belongs either to the SIS or to the schedulers, never both, so
 * exactly one of the two section sources ever has rows and this picks between
 * them. Nothing here knows about this browser's unsaved edits or about the
 * filters; the page lays those over the top.
 */

import { computed, type Ref } from "vue";
import dayjs from "dayjs";
import { currentTerm } from "./helpers/currentTerm";
import { useSisEmployeesQuery } from "./queries/useSisEmployeesQuery";
import { useSisSectionsQuery } from "./queries/useSisSectionsQuery";
import { useSisTermsQuery } from "./queries/useSisTermsQuery";
import { useTermPlanQuery } from "./queries/useTermPlanQuery";

export function useTermSchedule(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const today = computed(() => dayjs().format("YYYY-MM-DD"));

  const termsQuery = useSisTermsQuery();

  /** The term the URL names, or failing that the one we are in today. */
  const term = computed(() => {
    const terms = termsQuery.data.value ?? [];
    const namedTerm = terms.find(({ id }) => id === termCode.value);

    return namedTerm ?? currentTerm(terms, today.value);
  });

  /** The term actually on screen, which the URL may not name. */
  const activeTermCode = computed(() => term.value?.id ?? null);

  /** Newest first, since planning looks forward. */
  const termOptions = computed(() =>
    [...(termsQuery.data.value ?? [])].sort((a, b) => b.id - a.id),
  );

  const employeesQuery = useSisEmployeesQuery(groupId);

  const sectionsQuery = useSisSectionsQuery(groupId, activeTermCode);
  const termPlanQuery = useTermPlanQuery(groupId, activeTermCode);

  /**
   * Everything read-only on this page hangs off this one value, and the server
   * decides it. Read-only until the answer arrives, so a slow network cannot
   * open a term the SIS has already published.
   */
  const isReadOnly = computed(
    () => termPlanQuery.data.value?.isEditable !== true,
  );

  return {
    today,
    term,
    activeTermCode,
    termOptions,
    isReadOnly,
    /** Who a section can be assigned to: the department's own people. */
    roster: computed(() => employeesQuery.data.value ?? []),
    /** The term's sections as the server sent them, before any local edit. */
    sections: computed(() =>
      isReadOnly.value
        ? (sectionsQuery.data.value ?? [])
        : (termPlanQuery.data.value?.sections ?? []),
    ),
  };
}
