import { computed } from "vue";
import { uniqBy } from "lodash-es";
import type { Instructor, CourseShortCode, Term, Leave } from "@/types";
import { sortByName, dayjs } from "@/utils";
import { useTerms } from "./useTerms";
import {
  useGroupCourseHistory,
  type InstructorsByCourseAndTermKey,
} from "./useGroupCourseHistory";

/**
 * for a given term, get the list of leaves for the instructor
 */
function selectInstructorTermLeaves(
  instructor: Instructor,
  term: Term,
): Leave[] {
  return (
    instructor.leaves?.filter((leave) => {
      const leaveStart = dayjs(leave.start_date);
      const leaveEnd = dayjs(leave.end_date);
      const termStart = dayjs(term.startDate);
      const termEnd = dayjs(term.endDate);

      return (
        termStart.isBetween(leaveStart, leaveEnd, "day", "[]") ||
        termEnd.isBetween(leaveStart, leaveEnd, "day", "[]")
      );
    }) ?? []
  );
}

export function useGroupInstructors(groupId) {
  const { terms } = useTerms();
  const { instructorsByCourseTermMap, isLoadingComplete, termLoadState } =
    useGroupCourseHistory(groupId);

  const allInstructors = computed(() => {
    console.log("allInstructors computed");
    const instructors = [...instructorsByCourseTermMap.value.values()].flat();
    // remove duplicates
    return uniqBy(instructors, "id").sort(sortByName);
  });

  const instructorLookup = computed(() => {
    const lookup = new Map<Instructor["id"], Instructor>();
    allInstructors.value.forEach((instructor) => {
      lookup.set(instructor.id, instructor);
    });
    return lookup;
  });

  const instructorAppointmentTypesMap = computed(() => {
    const map = new Map<Instructor["academicAppointment"], number>();
    allInstructors.value.forEach((instructor) => {
      const count = map.get(instructor.academicAppointment) ?? 0;
      map.set(instructor.academicAppointment, count + 1);
    });
    return map;
  });

  return {
    isLoadingComplete,
    termLoadState,
    allInstructors,
    instructorLookup,
    instructorAppointmentTypesMap,
    getInstructorsForCoursePerTerm(courseShortCode: CourseShortCode) {
      return terms.value.map((term) => {
        const key =
          `${courseShortCode}-${term.id}` as InstructorsByCourseAndTermKey;
        return instructorsByCourseTermMap.value.get(key) ?? [];
      });
    },
    getLeavesForInstructorPerTerm(instructorId: Instructor["id"]) {
      const instructor = instructorLookup.value.get(instructorId);
      if (!instructor) {
        throw new Error(`Cannot find instructor with id: ${instructorId}`);
      }

      return terms.value.map((term) =>
        selectInstructorTermLeaves(instructor, term),
      );
    },
  };
}
