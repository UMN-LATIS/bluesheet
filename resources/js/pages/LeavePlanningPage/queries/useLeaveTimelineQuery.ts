import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { fetchLeaveTimeline } from "@/api";

export function useLeaveTimelineQuery(
  groupId: Readonly<Ref<number>>,
  startTermId: Readonly<Ref<number | null>>,
  endTermId: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["leavePlanning", "leaves", groupId, startTermId, endTermId],
    queryFn: () =>
      fetchLeaveTimeline(groupId.value, startTermId.value, endTermId.value),
    placeholderData: keepPreviousData,
  });
}
