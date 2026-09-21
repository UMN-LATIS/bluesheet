import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import type { LeaveTimeline } from "@/types";
import { fetchLeaveTimeline } from "@/api";

const GROUP_ID_KEY_INDEX = 2;

export function useLeaveTimelineQuery(
  groupId: Readonly<Ref<number>>,
  startTermCode: Readonly<Ref<number | null>>,
  endTermCode: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["leavePlanning", "leaves", groupId, startTermCode, endTermCode],
    queryFn: () =>
      fetchLeaveTimeline(groupId.value, startTermCode.value, endTermCode.value),
    placeholderData: (
      previous: LeaveTimeline | null | undefined,
      previousQuery,
    ) =>
      previousQuery?.queryKey[GROUP_ID_KEY_INDEX] === groupId.value
        ? previous
        : undefined,
  });
}
