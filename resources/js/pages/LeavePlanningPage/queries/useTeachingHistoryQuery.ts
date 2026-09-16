import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import type { PlanningTermRange } from "@/types";
import { fetchTeachingHistory } from "@/api";

export function useTeachingHistoryQuery(
  groupId: Readonly<Ref<number>>,
  range: Readonly<Ref<PlanningTermRange | null>>,
  isWanted: Readonly<Ref<boolean>>,
) {
  const startTermId = computed(() => range.value?.startTermId ?? null);
  const endTermId = computed(() => range.value?.endTermId ?? null);

  return useQuery({
    queryKey: [
      "leavePlanning",
      "teachingHistory",
      groupId,
      startTermId,
      endTermId,
    ],
    enabled: computed(() => isWanted.value && range.value !== null),
    queryFn: () =>
      fetchTeachingHistory(groupId.value, startTermId.value!, endTermId.value!),
    placeholderData: keepPreviousData,
  });
}
