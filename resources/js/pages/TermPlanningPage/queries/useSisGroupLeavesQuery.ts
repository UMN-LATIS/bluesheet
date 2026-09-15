import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { axios } from "@/utils";
import type { TermLeave } from "../types";

const OK = 200;
const FORBIDDEN = 403;

/**
 * Disabled while `termCode` is null. A scheduler who cannot read the
 * department's leaves gets an empty list, not an error.
 */
export function useSisGroupLeavesQuery(
  groupId: Readonly<Ref<number>>,
  termCode: Readonly<Ref<number | null>>,
) {
  return useQuery({
    queryKey: ["sis", "leaves", groupId, termCode] as const,
    enabled: computed(() => termCode.value !== null),
    queryFn: async (): Promise<TermLeave[]> => {
      const res = await axios.get<TermLeave[]>(
        `/api/sis/groups/${groupId.value}/leaves`,
        {
          params: { term: termCode.value },
          // Counting 403 as an answer keeps it out of the error
          // interceptor, which would raise the global error modal.
          validateStatus: (status) => status === OK || status === FORBIDDEN,
        },
      );

      return res.status === FORBIDDEN ? [] : res.data;
    },
  });
}
