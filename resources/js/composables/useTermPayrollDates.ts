import * as api from "@/api";
import * as T from "@/types";
import { computed, reactive, toRefs } from "vue";

export const useTermPayrollDates = () => {
  const state = reactive({
    loadStatus: "idle" as "idle" | "loading" | "success" | "error",
    termPayrollDates: [] as T.TermPayrollDate[],
  });

  // fetch data if needed
  if (state.loadStatus === "idle") {
    api
      .getTermPayrollDates()
      .then((termPayrollDates) => {
        state.termPayrollDates = termPayrollDates;
        state.loadStatus = "success";
      })
      .catch((error) => {
        state.loadStatus = "error";
        throw new Error(error);
      });
  }

  return {
    ...toRefs(state),
    isLoaded: computed(() => state.loadStatus === "success"),
  };
};
