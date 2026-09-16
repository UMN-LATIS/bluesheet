import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import type { LeaveTimeline } from "@/types";
import { fetchLeaveTimeline } from "@/api";

const GROUP_ID_KEY_INDEX = 2;

export function useLeaveTimelineQuery(
  groupId: Readonly<Ref<number>>,
  startTermId: Readonly<Ref<number | null>>,
  endTermId: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["leavePlanning", "leaves", groupId, startTermId, endTermId],
    queryFn: () =>
      fetchLeaveTimeline(groupId.value, startTermId.value, endTermId.value),
    placeholderData: (
      previous: LeaveTimeline | null | undefined,
      previousQuery,
    ) =>
      previousQuery?.queryKey[GROUP_ID_KEY_INDEX] === groupId.value
        ? previous
        : undefined,
  });
}
