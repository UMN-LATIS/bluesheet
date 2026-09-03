import { useQuery } from "@tanstack/vue-query";
import { axios } from "@/utils";
import type { SisGroup } from "../types";

/** The departments this user can open in Term Planning. */
export function useSisGroupsQuery() {
  return useQuery({
    queryKey: ["sis", "groups"],
    queryFn: async (): Promise<SisGroup[]> => {
      const res = await axios.get<SisGroup[]>("/api/sis/groups");
      return res.data;
    },
  });
}
