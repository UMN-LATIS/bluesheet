import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { axios } from "@/utils";
import type { SisEmployee } from "../types";

export function useSisEmployeesQuery(groupId: Readonly<Ref<number>>) {
  return useQuery({
    queryKey: ["sis", "employees", groupId],
    queryFn: async (): Promise<SisEmployee[]> => {
      const res = await axios.get<SisEmployee[]>(
        `/api/sis/groups/${groupId.value}/employees`,
      );
      return res.data;
    },
  });
}
