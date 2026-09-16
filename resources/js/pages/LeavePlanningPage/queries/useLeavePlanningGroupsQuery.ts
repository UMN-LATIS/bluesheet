import { useQuery } from "@tanstack/vue-query";
import { fetchLeavePlanningGroups } from "@/api";

export function useLeavePlanningGroupsQuery() {
  return useQuery({
    queryKey: ["leavePlanning", "groups"],
    queryFn: fetchLeavePlanningGroups,
  });
}
