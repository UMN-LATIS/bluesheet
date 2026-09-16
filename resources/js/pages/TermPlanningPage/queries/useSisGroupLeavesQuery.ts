import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { fetchTermLeavesForGroup } from "@/api";

export function useSisGroupLeavesQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["sis", "leaves", groupId, termCode] as const,
    enabled: computed(() => termCode.value !== null),
    queryFn: () => fetchTermLeavesForGroup(groupId.value, termCode.value!),
  });
}
