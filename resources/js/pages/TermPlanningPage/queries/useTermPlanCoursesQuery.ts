import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";
import { axios } from "@/utils";
import type { PlannableCourse } from "../types";

export const termPlanCoursesQueryKey = (groupId: Readonly<Ref<number>>) =>
  ["termPlan", "courses", groupId] as const;

/**
 * The department's whole catalogue, both sides of it, in one list. Not scoped
 * to a term: a course is the same course from one year to the next.
 */
export function useTermPlanCoursesQuery(groupId: Readonly<Ref<number>>) {
  return useQuery({
    queryKey: termPlanCoursesQueryKey(groupId),
    queryFn: async (): Promise<PlannableCourse[]> => {
      const res = await axios.get<PlannableCourse[]>(
        `/api/term-planning/groups/${groupId.value}/courses`,
      );
      return res.data;
    },
  });
}
