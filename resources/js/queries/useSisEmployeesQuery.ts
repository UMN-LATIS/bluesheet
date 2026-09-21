import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { fetchSisEmployeesForGroup } from "@/api";

/** Everyone appointed to the group's department. Both planners read it. */
export function useSisEmployeesQuery(
  groupId: Readonly<Ref<number>>,
  isEnabled?: Readonly<Ref<boolean>>,
) {
  return useQuery({
    queryKey: ["sis", "employees", groupId],
    queryFn: () => fetchSisEmployeesForGroup(groupId.value),
    enabled: isEnabled,
  });
}
