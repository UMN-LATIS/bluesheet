import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { axios } from "@/utils";
import type { SisSection } from "../types";

/** Disabled while `termCode` is null. */
export function useSisSectionsQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["sis", "sections", groupId, termCode],
    enabled: computed(() => termCode.value !== null),
    queryFn: async (): Promise<SisSection[]> => {
      const res = await axios.get<SisSection[]>(
        `/api/sis/groups/${groupId.value}/sections`,
        { params: { term: termCode.value } },
      );
      return res.data;
    },
  });
}
