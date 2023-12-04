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
  };

  const actions = {
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

      return state.terms.value;
    },
  };

  // initialize the store
  actions.init();

  return {
    ...state,
    ...getters,
    ...actions,
  };
});
