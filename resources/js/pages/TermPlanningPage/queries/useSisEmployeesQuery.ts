import { useQuery } from "@tanstack/vue-query";
import { axios } from "@/utils";
import type { SisEmployee } from "../types";

export function useSisEmployeesQuery(groupId: number) {
  return useQuery({
    queryKey: ["sis", "employees", groupId],
    queryFn: async (): Promise<SisEmployee[]> => {
      const res = await axios.get<SisEmployee[]>(
        `/api/sis/groups/${groupId}/employees`,
      );
      return res.data;
    },
  });
}
