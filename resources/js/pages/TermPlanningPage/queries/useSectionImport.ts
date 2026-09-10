import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { axios } from "@/utils";
import type { PlannedSection } from "../types";
import { termPlanQueryKey } from "./useTermPlanQuery";

export interface ImportRequest {
  sourceTermId: number;
  sectionIds: number[];
}

export function useSectionImport(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  const queryClient = useQueryClient();
  const url = () =>
    `/api/term-planning/groups/${groupId.value}/sections/batch`;

  const refetchTermPlan = () =>
    queryClient.invalidateQueries({
      queryKey: termPlanQueryKey(groupId, termCode),
    });

  const importSections = useMutation({
    mutationFn: async ({ sourceTermId, sectionIds }: ImportRequest) => {
      const res = await axios.post<PlannedSection[]>(url(), {
        termId: termCode.value,
        sourceTermId,
        sectionIds,
      });
      return res.data;
    },
    onSuccess: refetchTermPlan,
  });

  const undoImport = useMutation({
    mutationFn: (sectionIds: number[]) =>
      // axios.delete's 2nd argument is config, not a body. Drop
      // the `data:` wrapper and the request carries nothing, and
      // the endpoint refuses it as a missing sectionIds field.
      axios.delete(url(), { data: { termId: termCode.value, sectionIds } }),
    onSuccess: refetchTermPlan,
  });

  return { importSections, undoImport };
}
