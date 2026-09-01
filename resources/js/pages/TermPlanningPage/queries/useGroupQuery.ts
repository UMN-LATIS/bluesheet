import { useQuery } from "@tanstack/vue-query";
import { fetchGroup } from "@/api";

/** The BlueSheet group the page is planning for, here only to name it. */
export function useGroupQuery(groupId: number) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroup(groupId),
  });
}
