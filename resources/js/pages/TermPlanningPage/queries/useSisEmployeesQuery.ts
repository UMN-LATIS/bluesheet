import { useQuery } from "@tanstack/vue-query";
import { axios } from "@/utils";
import type { SisEmployee } from "../types";

/**
 * The people appointed to the group's department, which is who a section can
 * be assigned to. Drawn from appointments rather than from who teaches, so
 * someone on leave or between assignments is still on the list.
 */
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
