import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { fetchLeaveTimeline } from "@/api";

/**
 * The people and leaves behind the leave panel, which the leave strip cannot
 * supply: the strip's rows carry no description, job codes, or eligibility
 * flags. Held until a leave is selected, because nothing else on the page
 * reads this.
 */
export function useTermLeaveTimelineQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
  isLeaveSelected: Readonly<Ref<boolean>>,
) {
  return useQuery({
    queryKey: ["leavePlanning", "leaves", groupId, termCode, termCode] as const,
    enabled: computed(() => termCode.value !== null && isLeaveSelected.value),
    queryFn: () =>
      fetchLeaveTimeline(groupId.value, termCode.value, termCode.value),
  });
}
