import { useQuery } from "@tanstack/vue-query";
import { computed, type MaybeRef, type Ref } from "vue";
import { fetchLeaveArtifacts } from "@/api/leavePlanningApi";

export const leaveArtifactsQueryKey = (leaveId: MaybeRef<number | null>) => [
  "leaves",
  leaveId,
  "artifacts",
];

export function useLeaveArtifactsQuery(leaveId: Readonly<Ref<number | null>>) {
  return useQuery({
    queryKey: leaveArtifactsQueryKey(leaveId),
    queryFn: () => fetchLeaveArtifacts(leaveId.value as number),
    enabled: computed(() => leaveId.value !== null),
  });
}
