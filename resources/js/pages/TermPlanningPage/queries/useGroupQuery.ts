import { useQuery } from "@tanstack/vue-query";
import { fetchGroup } from "@/api";

export function useGroupQuery(groupId: number) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroup(groupId),
  });
}
