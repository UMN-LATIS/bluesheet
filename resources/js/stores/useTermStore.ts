import { computed, toRefs, reactive } from "vue";
import * as T from "@/types";
import { defineStore } from "pinia";
import * as api from "@/api";
import { dayjs } from "@/utils";
import { keyBy } from "lodash";

interface TermsStoreState {
  termLookup: Record<T.Term["id"], T.Term>;
  loadStatus: T.LoadState;
}

export const useTermStore = defineStore("terms", () => {
  const state = reactive<TermsStoreState>({
    termLookup: {},
    loadStatus: "idle",
  });

  const getters = {
    terms: computed(
      (): T.Term[] =>
        Object.values(state.termLookup).filter(Boolean) as T.Term[],
    ),
    getTerm: computed(() => (termId: T.Term["id"]): T.Term | null => {
      return state.termLookup[termId] ?? null;
    }),
    currentTerm: computed((): T.Term | null => {
      const currentTerm = getters.terms.value.find((term) => {
        const termStart = dayjs(term.startDate);
        const termEnd = dayjs(term.endDate);
        const today = dayjs();
        return today.isBetween(termStart, termEnd, "day", "[]");
      });
      return currentTerm ?? null;
    }),
    sortedTerms: computed((): T.Term[] => {
      return [...getters.terms.value].sort((a, b) => {
        return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
      });
    }),
    earliestTerm: computed((): T.Term | null => {
      if (!getters.terms.value.length) return null;
      return getters.sortedTerms.value[0];
    }),
    latestTerm: computed((): T.Term | null => {
      if (!getters.terms.value.length) return null;
      return getters.sortedTerms.value[getters.terms.value.length - 1];
    }),

    hasTerms: computed((): boolean => getters.terms.value.length > 0),

    isCurrentTerm: computed(() => (termId: T.Term["id"]): boolean => {
      return getters.currentTerm.value?.id === termId;
    }),

    termSelectOptions: computed((): T.SelectOption[] =>
      getters.terms.value.map((term) => ({
        text: term.name,
        value: term.id,
      })),
    ),

    isTermPlannable: computed(() => (termId: T.Term["id"]): boolean => {
      const term = getters.getTerm.value(termId);
      if (!term) {
        throw new Error(
          `Cannot determine if term is plannable. Term ${termId} not found.`,
        );
      }
      // terms that start within the next 2 months are no longer plannable
      const lastPlannableDate = dayjs(term.startDate).subtract(2, "months");
      return dayjs().isBefore(lastPlannableDate);
    }),
  };

  const actions = {
    async init() {
      // if we're already loading or loaded, don't do anything
      if (state.loadStatus !== "idle") return;

      try {
        await actions.fetchTerms(), (state.loadStatus = "complete");
      } catch (e) {
        state.loadStatus = "error";
        throw new Error(`Failed to load terms: ${e}`);
      }
    },
    async fetchTerms() {
      const allTerms = await api.fetchTerms();
      const MAX_TERM_DATE = dayjs().add(5, "year").format("YYYY-MM-DD");

      const termInRange = allTerms.filter((t) => {
        // ignore terms that are super far out
        return dayjs(t.endDate).isSameOrBefore(MAX_TERM_DATE);
      });
      state.termLookup = keyBy<T.Term>(termInRange, "id");
      return state.termLookup;
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
