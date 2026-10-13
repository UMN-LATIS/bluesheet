import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { fetchTeachingHistory } from "@/api";
import { historyRangeOf } from "../helpers/personPanel";

/** Disabled while `termCode` is null or `isEnabled` is false. */
export function useTeachingHistoryQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
  isEnabled: Readonly<Ref<boolean>>,
) {
  return useQuery({
    queryKey: ["termPlan", "teachingHistory", groupId, termCode] as const,
    enabled: computed(() => isEnabled.value && termCode.value !== null),
    queryFn: () => {
      const { startTermCode, endTermCode } = historyRangeOf(
        termCode.value ?? 0,
      );
      return fetchTeachingHistory(groupId.value, startTermCode, endTermCode);
    },
  });
}
