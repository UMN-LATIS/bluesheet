import * as api from "@/api";
import * as T from "@/types";
import { reactive, toRefs, type Ref } from "vue";

export const useLeaveDateOptions = (): {
  startDateOptions: Ref<T.LeaveStartDateOption[]>;
  endDateOptions: Ref<T.LeaveEndDateOption[]>;
} => {
  const state = reactive({
    loadStatus: "idle" as "idle" | "loading" | "success" | "error",
    startDateOptions: [] as T.LeaveStartDateOption[],
    endDateOptions: [] as T.LeaveEndDateOption[],
  });

  // fetch data if needed
  if (state.loadStatus === "idle") {
    api
      .getLeaveDateOptions()
      .then((opts) => {
        state.startDateOptions = opts.startDateOptions;
        state.endDateOptions = opts.endDateOptions;
        state.loadStatus = "success";
      })
      .catch((error) => {
        state.loadStatus = "error";
        throw new Error(error);
      });
  }

  return toRefs(state);
};
