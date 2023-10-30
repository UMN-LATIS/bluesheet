import { ref, computed } from "vue";
import { dayjs } from "@/lib";
import type { Term } from "@/types";
import * as api from "@/api";

const MAX_TERM_DATE = dayjs().add(3, "year").format("YYYY-MM-DD");

export function useTerms() {
  const termsLookup = ref<Map<number, Term>>(new Map());
  const terms = computed(() => termsLookup.value.values());

  api
    .getTerms()
    .then((allTerms) => {
      // ignore terms that are super far out
      return allTerms.filter((t) => {
        return dayjs(t.endDate).isSameOrBefore(MAX_TERM_DATE);
      });
    })
    .then((filteredTerms) => {
      // update the termsLookup. Do this with entries so that
      // we can update the ref once, which avoids triggering
      // computed with each update
      const entries: [number, Term][] = filteredTerms.map((term) => [
        term.id,
        term,
      ]);
      termLookup.value = new Map<number, Term>(entries);
    });

  return {
    terms,
    termsLookup,
  };
}
