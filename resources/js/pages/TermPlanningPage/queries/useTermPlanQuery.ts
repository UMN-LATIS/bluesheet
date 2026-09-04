import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { axios } from "@/utils";
import type { PlannedSection } from "../types";

/** What the term planning endpoint answers with. */
export interface TermPlan {
  /**
   * False once the SIS has published this term for the department. The server
   * decides it and enforces it; the page only reflects it.
   */
  isEditable: boolean;
  sections: PlannedSection[];
}

export const termPlanQueryKey = (
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) => ["termPlan", "sections", groupId, termCode] as const;

/** Disabled while `termCode` is null. */
export function useTermPlanQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: termPlanQueryKey(groupId, termCode),
    enabled: computed(() => termCode.value !== null),
    queryFn: async (): Promise<TermPlan> => {
      const res = await axios.get<TermPlan>(
        `/api/term-planning/groups/${groupId.value}/sections`,
        { params: { term: termCode.value } },
      );
      return res.data;
    },
  });
}
