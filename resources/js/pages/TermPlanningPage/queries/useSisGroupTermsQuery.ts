import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { axios } from "@/utils";
import type { SisTerm } from "../types";

/** Newest first. Only terms this department has sections in. */
export function useSisGroupTermsQuery(groupId: Readonly<Ref<number>>) {
  return useQuery({
    queryKey: ["sis", "groupTerms", groupId],
    queryFn: async (): Promise<SisTerm[]> => {
      const res = await axios.get<SisTerm[]>(
        `/api/sis/groups/${groupId.value}/terms`,
      );
      return res.data;
    },
  });
}
