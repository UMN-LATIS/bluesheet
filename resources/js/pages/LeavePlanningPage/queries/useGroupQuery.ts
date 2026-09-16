import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { fetchGroup } from "@/api";

export function useGroupQuery(
  groupId: Readonly<Ref<number>>,
  isEnabled: Readonly<Ref<boolean>>,
) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroup(groupId.value),
    enabled: isEnabled,
  });
}
