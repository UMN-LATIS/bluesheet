import { useGroupCourseHistory } from "./useGroupCourseHistory";
import { computed } from "vue";
import { uniqBy } from "lodash-es";
import { sortByName } from "@/utils";

export function useGroupInstructors(groupId) {
  const { coursesByInstructorAndTermMap, instructorsByCourseAndTermMap } =
    useGroupCourseHistory(groupId);

  const allInstructors = computed(() => {
    const instructors = [
      ...instructorsByCourseAndTermMap.value.values(),
    ].flat();
    // remove duplicates
    return uniqBy(instructors, "id").sort(sortByName);
  });
}
