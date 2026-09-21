import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { getSisEmployeesForGroup } from "@/api";

/** Everyone appointed to the group's department. */
export function useSisEmployeesQuery(
  groupId: Readonly<Ref<number>>,
  isEnabled?: Readonly<Ref<boolean>>,
) {
  return useQuery({
    queryKey: ["sis", "employees", groupId],
    queryFn: () => getSisEmployeesForGroup(groupId.value),
    enabled: isEnabled,
  });
}
