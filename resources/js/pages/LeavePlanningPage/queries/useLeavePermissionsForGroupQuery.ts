import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { getPermissionsForGroupLeaves } from "@/api";

export function useLeavePermissionsForGroupQuery(
  groupId: Readonly<Ref<number>>,
) {
  return useQuery({
    queryKey: ["permissions", "groupLeaves", groupId],
    queryFn: () => getPermissionsForGroupLeaves(groupId.value),
  });
}
