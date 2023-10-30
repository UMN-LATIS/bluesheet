import { ref, computed } from "vue";
import { dayjs } from "@/lib";
import type { Term } from "@/types";
import * as api from "@/api";

interface UseTermsState {
  isFetching: boolean;
  cache: {
    termsLookupMap?: Map<number, Term>;
  };
}

const state: UseTermsState = {
  isFetching: false,
  cache: {},
};

const MAX_TERM_DATE = dayjs().add(3, "year").format("YYYY-MM-DD");

function fetchTermsLookup(): Promise<Map<number, Term>> {
  return api
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
      return new Map(entries);
    });
}

export function useTerms() {
  const termsLookup = ref<Map<number, Term>>(new Map());
  const terms = computed((): Term[] => [...termsLookup.value.values()]);

  // terms shouldn't change, so we can fetch them once and cache them
  if (!state.isFetching && !state.cache.termsLookupMap) {
    state.isFetching = true;
    fetchTermsLookup().then((termsLookupMap) => {
      state.cache.termsLookupMap = termsLookupMap;
      termsLookup.value = termsLookupMap;
      state.isFetching = false;
    });
  }

  return {
    terms,
    termsLookup,
  };
}
