import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { fetchLeaveTimeline } from "@/api";

export function useTermLeaveTimelineQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["leavePlanning", "leaves", groupId, termCode, termCode] as const,
    enabled: computed(() => termCode.value !== null),
    queryFn: () =>
      fetchLeaveTimeline(groupId.value, termCode.value, termCode.value),
  });
}
