import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { fetchLeavePermissions } from "@/api/leavePlanningApi";

export function useLeavePermissionsQuery(
  leaveId: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["permissions", "leave", leaveId],
    queryFn: () => fetchLeavePermissions(leaveId.value as number),
    enabled: computed(() => leaveId.value !== null),
  });
}
