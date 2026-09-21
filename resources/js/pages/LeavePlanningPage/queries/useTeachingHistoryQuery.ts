import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import type { PlanningTermRange } from "@/types";
import { fetchTeachingHistory } from "@/api";

export function useTeachingHistoryQuery(
  groupId: Readonly<Ref<number>>,
  range: Readonly<Ref<PlanningTermRange | null>>,
  isEnabled: Readonly<Ref<boolean>>,
) {
  const startTermCode = computed(() => range.value?.startTermCode ?? null);
  const endTermCode = computed(() => range.value?.endTermCode ?? null);

  return useQuery({
    queryKey: [
      "leavePlanning",
      "teachingHistory",
      groupId,
      startTermCode,
      endTermCode,
    ],
    enabled: computed(() => isEnabled.value && range.value !== null),
    queryFn: () =>
      fetchTeachingHistory(groupId.value, startTermCode.value!, endTermCode.value!),
  });
}
