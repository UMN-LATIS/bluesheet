import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { saveCostSetting } from "@/api";
import type { CostSettingValue } from "@/types";

export function useCostMutations(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const queryClient = useQueryClient();

  const saveSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: CostSettingValue | null }) =>
      saveCostSetting(groupId.value, termCode.value ?? 0, key, value),
    // Return the promise: without it the autosave drops the
    // edit before the refetch ends and the old value shows.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["termPlan", "costAssumptions"] }),
  });

  return { saveSetting };
}
