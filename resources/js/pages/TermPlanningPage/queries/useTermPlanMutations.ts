import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { axios } from "@/utils";
import { toSectionPayload } from "../helpers/sectionPayload";
import type { PlannedSection } from "../types";
import { termPlanQueryKey } from "./useTermPlanQuery";

/**
 * Writes to a term plan. Each one invalidates the term's sections, so the
 * server's answer replaces whatever the page was showing rather than the two
 * being reconciled by hand.
 */
export function useTermPlanMutations(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const queryClient = useQueryClient();
  const url = () => `/api/term-planning/groups/${groupId.value}/sections`;

  const refetchTermPlan = () =>
    queryClient.invalidateQueries({
      queryKey: termPlanQueryKey(groupId, termCode),
    });

  const saveSection = useMutation({
    mutationFn: (section: PlannedSection) =>
      axios.put(`${url()}/${section.id}`, toSectionPayload(section)),
    onSuccess: refetchTermPlan,
  });

  const deleteSection = useMutation({
    mutationFn: (sectionId: number) => axios.delete(`${url()}/${sectionId}`),
    onSuccess: refetchTermPlan,
  });

  return { saveSection, deleteSection };
}
