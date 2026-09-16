import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { getPermissionsForGroupCourses } from "@/api";

export function useCoursePermissionsQuery(groupId: Readonly<Ref<number>>) {
  return useQuery({
    queryKey: ["permissions", "groupCourses", groupId],
    queryFn: () => getPermissionsForGroupCourses(groupId.value),
  });
}
