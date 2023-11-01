import { Term } from "@/types";
import { defineStore } from "pinia";
import * as api from "@/api";
import { dayjs } from "@/utils";

export const useTermsStore = defineStore("terms", {
  state: () => ({
    terms: [] as Term[],
    isLoaded: false,
  }),
  getters: {
    currentTerm(): Term | null {
      const currentTerm = this.terms.find((term) => {
        const termStart = dayjs(term.startDate);
        const termEnd = dayjs(term.endDate);
        const today = dayjs();
        return today.isBetween(termStart, termEnd, "day", "[]");
      });

      return currentTerm ?? null;
    },
  },
  actions: {
    async init() {
      await this.fetchTerms();
      this.isLoaded = true;
    },
    async fetchTerms() {
      const allTerms = await api.getTerms();
      const MAX_TERM_DATE = dayjs().add(3, "year").format("YYYY-MM-DD");

      this.terms = allTerms.filter((t) => {
        // ignore terms that are super far out
        return dayjs(t.endDate).isSameOrBefore(MAX_TERM_DATE);
      });
    },
  },
});
