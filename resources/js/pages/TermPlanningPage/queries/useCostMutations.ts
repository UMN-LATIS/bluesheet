import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import {
  saveCostLineOverride,
  saveJobCodeRateOverride,
  saveTaRateOverride,
} from "@/api";
import type {
  LineOverrideEdit,
  RateOverrideEdit,
} from "../helpers/costOverrides";

export function useCostMutations(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const queryClient = useQueryClient();
  // Return the promise: without it the autosave drops the
  // edit before the refetch ends and the old value shows.
  const refetchAssumptions = () =>
    queryClient.invalidateQueries({
      queryKey: ["termPlan", "costAssumptions"],
    });

  const saveRateOverride = useMutation({
    mutationFn: ({ rate, amount }: RateOverrideEdit) => {
      const term = termCode.value ?? 0;
      if (rate.kind === "jobCode") {
        return saveJobCodeRateOverride(
          groupId.value,
          term,
          rate.jobCode,
          amount,
        );
      }

      return saveTaRateOverride(
        groupId.value,
        term,
        rate.appointmentPercent,
        rate.studentStatus,
        amount,
      );
    },
    onSuccess: refetchAssumptions,
  });

  const saveLineOverride = useMutation({
    mutationFn: (edit: LineOverrideEdit) =>
      saveCostLineOverride(groupId.value, termCode.value ?? 0, edit),
    onSuccess: refetchAssumptions,
  });

  return { saveRateOverride, saveLineOverride };
}
