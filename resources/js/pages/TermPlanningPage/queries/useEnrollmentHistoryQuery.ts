import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { fetchEnrollmentHistory } from "@/api";

/** Disabled while `termCode` is null. */
export function useEnrollmentHistoryQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
  isEnabled: Readonly<Ref<boolean>>,
) {
  return useQuery({
    queryKey: ["termPlan", "enrollmentHistory", groupId, termCode] as const,
    enabled: computed(() => isEnabled.value && termCode.value !== null),
    queryFn: () => fetchEnrollmentHistory(groupId.value, termCode.value ?? 0),
  });
}
