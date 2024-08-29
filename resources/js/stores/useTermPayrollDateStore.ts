import { defineStore } from "pinia";
import * as api from "@/api";
import * as T from "@/types";

export const useTermPayrollDatesStore = defineStore("termPayrollDates", {
  state: () => ({
    termPayrollDates: [] as T.TermPayrollDate[],
    loadStatus: "idle" as T.LoadState,
  }),
  getters: {
    isLoaded: (state) => state.loadStatus === "complete",
  },
  actions: {
    async init() {
      if (this.loadStatus === "idle") {
        return this.fetchTermPayrollDates();
      }
    },
    async fetchTermPayrollDates() {
      // If we're already loading, don't do anything
      if (this.loadStatus === "loading") return;

      try {
        this.loadStatus = "loading";
        this.termPayrollDates = await api.getTermPayrollDates();
        this.loadStatus = "complete";
      } catch (error) {
        this.loadStatus = "error";
        throw new Error(
          `Could not fetch term payroll dates: ${(error as Error).message}`,
        );
      }
    },
  },
});
