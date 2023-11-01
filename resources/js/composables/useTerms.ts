import { ref, computed } from "vue";
import { dayjs } from "@/lib";
import type { Term } from "@/types";
import * as api from "@/api";

const MAX_TERM_DATE = dayjs().add(3, "year").format("YYYY-MM-DD");

let termsCache: Term[] = [];

async function fetchTerms(): Promise<Term[]> {
  if (termsCache.length > 0) {
    return termsCache;
  }
  const terms = await api.getTerms();

  const filteredTerms = terms.filter((t) => {
    // ignore terms that are super far out
    return dayjs(t.endDate).isSameOrBefore(MAX_TERM_DATE);
  });
  termsCache = filteredTerms;
  return filteredTerms;
}

function getCurrentTerm(terms: Term[]): Term | null {
  const currentTerm = terms.find((term) => {
    const termStart = dayjs(term.startDate);
    const termEnd = dayjs(term.endDate);
    const today = dayjs();
    return today.isBetween(termStart, termEnd, "day", "[]");
  });

  return currentTerm ?? null;
}

let isFetching = false;
export function useTerms() {
  const termLookup = ref<Map<Term["id"], Term>>(new Map());
  const terms = computed(() => [...termLookup.value.values()]);

  if (!isFetching) {
    isFetching = true;
    fetchTerms().then((theTerms) => {
      for (const term of theTerms) {
        termLookup.value.set(term.id, term);
      }
      isFetching = false;
    });
  }

  return {
    terms,
    termLookup,
    currentTerm: computed((): Term | null => getCurrentTerm(terms.value)),
  };
}
