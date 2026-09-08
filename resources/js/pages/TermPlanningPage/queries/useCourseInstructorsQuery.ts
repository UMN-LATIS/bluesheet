import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import { axios } from "@/utils";

/** One person's most recent term on a course, in one role. */
export interface CourseInstructor {
  emplid: number;
  /** "PI", "TA", "SI"; the same person can appear once per role they held. */
  role: string;
  lastTermId: number;
  /** True when that term is one this department planned, not one the SIS ran. */
  isPlanned: boolean;
}

/** Disabled until a course is chosen. */
export function useCourseInstructorsQuery(
  groupId: Readonly<Ref<number>>,
  courseCode: Readonly<Ref<string>>,
) {
  return useQuery({
    queryKey: ["termPlan", "courseInstructors", groupId, courseCode] as const,
    enabled: computed(() => courseCode.value !== ""),
    queryFn: async (): Promise<CourseInstructor[]> => {
      const res = await axios.get<CourseInstructor[]>(
        `/api/term-planning/groups/${groupId.value}/course-instructors`,
        { params: { course: courseCode.value } },
      );
      return res.data;
    },
  });
}
