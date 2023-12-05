import { computed, ref } from "vue";
import { LoadState, Term } from "@/types";
import { defineStore } from "pinia";
import * as api from "@/api";
import { dayjs } from "@/utils";

export const useTermsStore = defineStore("terms", () => {
  const state = {
    terms: ref<Term[]>([]),
    loadStatus: ref<LoadState>("idle"),
  };

  const getters = {
    currentTerm: computed((): Term | null => {
      const currentTerm = state.terms.value.find((term) => {
        const termStart = dayjs(term.startDate);
        const termEnd = dayjs(term.endDate);
        const today = dayjs();
        return today.isBetween(termStart, termEnd, "day", "[]");
      });
      return currentTerm ?? null;
    }),
    earliestTerm: computed((): Term | null => {
      return state.terms.value.reduce(
        (earliest: Term | null, term: Term | null) => {
          if (!earliest || !term) {
            return term;
          }

          return dayjs(term.startDate).isBefore(earliest.startDate)
            ? term
            : earliest;
        },
        null,
      );
    }),
    latestTerm: computed((): Term | null => {
      return state.terms.value.reduce(
        (latest: Term | null, term: Term | null) => {
          if (!latest || !term) {
            return term;
          }

          return dayjs(term.endDate).isAfter(latest.endDate) ? term : latest;
        },
        null,
      );
    }),

    hasTerms: computed(() => state.terms.value.length > 0),
  };

  const actions = {
    /**
     * Fetches terms from the API if needed
     */
    async init() {
      // if we're already loading or loaded, don't do anything
      if (state.loadStatus.value !== "idle") return;

      try {
        await actions.fetchTerms();
        state.loadStatus.value = "complete";
      } catch (e) {
        state.loadStatus.value = "error";
        throw new Error(`Failed to load terms: ${e}`);
      }
    },
    async fetchTerms() {
      const allTerms = await api.fetchTerms();
      const MAX_TERM_DATE = dayjs().add(3, "year").format("YYYY-MM-DD");

      state.terms.value = allTerms.filter((t) => {
        // ignore terms that are super far out
        return dayjs(t.endDate).isSameOrBefore(MAX_TERM_DATE);
      });
    },
  };

  const methods = {
    isCurrentTerm(termId: Term["id"]) {
      return getters.currentTerm.value?.id === termId;
    },
  };

  // initialize the store
  actions.init();

  return {
    ...state,
    ...getters,
    ...actions,
    ...methods,
  };
});
