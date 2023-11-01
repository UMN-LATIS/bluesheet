import { ref, computed, watch } from "vue";
import { useTerms } from "./useTerms";
import * as api from "@/api";
import type {
  Course,
  Group,
  Instructor,
  Term,
  CourseShortCode,
  LoadState,
} from "@/types";
import pMap from "p-map";

export type CoursesByInstructorAndTermKey = `${Instructor["id"]}-${Term["id"]}`;
export type InstructorsByCourseAndTermKey = `${CourseShortCode}-${Term["id"]}`;

export type CoursesByInstructorTermMap = Map<
  CoursesByInstructorAndTermKey,
  Course[]
>;
export type InstructorsByCourseTermMap = Map<
  InstructorsByCourseAndTermKey,
  Instructor[]
>;

async function fetchCoursesAndInstructorsForTerm(
  groupId: Group["id"],
  termId: Term["id"],
) {
  const instructorsByCourseAndTermMap: InstructorsByCourseTermMap = new Map();
  const coursesByInstructorAndTermMap: CoursesByInstructorTermMap = new Map();

  const courses = await api.getGroupCoursesByTerm({
    groupId,
    termId,
    roles: ["PI", "TA"],
  });

  courses.forEach((course) => {
    const courseAndTermKey: InstructorsByCourseAndTermKey = `${course.shortCode}-${termId}`;
    const existingInstructors =
      instructorsByCourseAndTermMap.get(courseAndTermKey) ?? [];

    instructorsByCourseAndTermMap.set(courseAndTermKey, [
      ...existingInstructors,
      ...course.instructors,
    ]);
    course.instructors.forEach((instructor) => {
      const instructorAndTermKey: CoursesByInstructorAndTermKey = `${instructor.id}-${termId}`;
      const existingCourses =
        coursesByInstructorAndTermMap.get(instructorAndTermKey) ?? [];
      coursesByInstructorAndTermMap.set(instructorAndTermKey, [
        ...existingCourses,
        course,
      ]);
    });
  });

  return { coursesByInstructorAndTermMap, instructorsByCourseAndTermMap };
}

export function useGroupCourseHistory(groupId: Group["id"]) {
  const { terms } = useTerms();

  const instructorsByCourseTermMap = ref<
    Map<InstructorsByCourseAndTermKey, Instructor[]>
  >(new Map());

  const coursesByInstructorTermMap = ref<
    Map<CoursesByInstructorAndTermKey, Course[]>
  >(new Map());

  const termLoadState = ref<Map<Term["id"], LoadState>>(new Map());

  const isLoadingComplete = computed(() => {
    return (
      terms.value.length > 0 &&
      terms.value.every((term) => {
        const state = termLoadState.value.get(term.id);
        if (!state) {
          return false;
        }
        return ["complete", "error"].includes(state);
      })
    );
  });

  watch(
    () => {
      return terms.value.map((term) => term.id).join(",");
    },
    () => {
      console.log("terms changed", terms.value);
      if (!terms.value.length) {
        console.log("useGroupCourseHistory: no terms found");
        return;
      }

      // initialize the load state
      terms.value.forEach((term) => {
        termLoadState.value.set(term.id, "idle");
      });

      pMap(
        terms.value,
        async (term) => {
          try {
            termLoadState.value.set(term.id, "loading");
            const {
              coursesByInstructorAndTermMap,
              instructorsByCourseAndTermMap,
            } = await fetchCoursesAndInstructorsForTerm(groupId, term.id);

            // do this as one batch update to avoid
            // triggering multiple re-renders
            coursesByInstructorTermMap.value = new Map([
              ...coursesByInstructorTermMap.value,
              ...coursesByInstructorAndTermMap,
            ]);
            instructorsByCourseTermMap.value = new Map([
              ...instructorsByCourseTermMap.value,
              ...instructorsByCourseAndTermMap,
            ]);
          } catch (e) {
            console.error(`Cannot fetch courses for term: ${term.name}`, e);
            termLoadState.value.set(term.id, "error");
          } finally {
            termLoadState.value.set(term.id, "complete");
          }
        },
        { concurrency: 5 },
      );
    },
    {
      immediate: true,
      deep: true,
    },
  );

  return {
    instructorsByCourseTermMap,
    coursesByInstructorTermMap,
    termLoadState,
    isLoadingComplete,
  };
}
