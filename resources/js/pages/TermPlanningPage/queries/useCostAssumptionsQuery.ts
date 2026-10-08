import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { fetchCostAssumptions } from "@/api";

const costAssumptionsQueryKey = (
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) => ["termPlan", "costAssumptions", groupId, termCode] as const;

/** Disabled while `termCode` is null or `isEnabled` is false. */
export function useCostAssumptionsQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
  isEnabled: Readonly<Ref<boolean>>,
) {
  return useQuery({
    queryKey: costAssumptionsQueryKey(groupId, termCode),
    enabled: computed(() => isEnabled.value && termCode.value !== null),
    queryFn: () => fetchCostAssumptions(groupId.value, termCode.value ?? 0),
  });
}
