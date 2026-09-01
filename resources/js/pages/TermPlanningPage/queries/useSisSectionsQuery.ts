import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { axios } from "@/utils";
import type { SisSection } from "../types";

/**
 * The group's sections for one term. Waits while `termCode` is null, which
 * it is until the terms payload has named the current term.
 */
export function useSisSectionsQuery(
  groupId: number,
  termCode: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["sis", "sections", groupId, termCode],
    enabled: computed(() => termCode.value !== null),
    queryFn: async (): Promise<SisSection[]> => {
      const res = await axios.get<SisSection[]>(
        `/api/sis/groups/${groupId}/sections`,
        { params: { term: termCode.value } },
      );
      return res.data;
    },
  });
}
