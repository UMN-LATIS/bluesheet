import { defineStore, storeToRefs } from "pinia";
import * as api from "@/api";
import type {
  Course,
  Group,
  Instructor,
  Term,
  CourseShortCode,
  LoadState,
  TimelessCourse,
  Leave,
} from "@/types";
import pMap from "p-map";
import { uniqBy } from "lodash-es";
import { ref, computed, watch } from "vue";
import { useTermsStore } from "./useTermsStore";
import { sortByName, dayjs } from "@/utils";

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

function toTimelessCourse(course: Course): TimelessCourse {
  return {
    shortCode: `${course.subject}-${course.catalogNumber}`,
    subject: course.subject,
    catalogNumber: course.catalogNumber,
    title: course.title,
    courseType: course.courseType,
    courseLevel: course.courseLevel,
  };
}

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

const useStore = defineStore("groupCourseHistory", () => {
  const state = {
    groupId: ref<Group["id"] | null>(null),
    instructorsByCourseTermMap: ref<InstructorsByCourseTermMap>(new Map()),
    coursesByInstructorTermMap: ref<CoursesByInstructorTermMap>(new Map()),
    termLoadStateMap: ref<Map<Term["id"], LoadState>>(new Map()),
  };

  const getters = {
    terms: computed(() => {
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);
      return terms.value;
    }),

    currentTerm: computed(() => {
      const termsStore = useTermsStore();
      const { currentTerm } = storeToRefs(termsStore);
      return currentTerm.value;
    }),

    isLoadingComplete: computed(() => {
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);
      return (
        terms.value.length > 0 &&
        terms.value.every((term) => {
          const loadState = state.termLoadStateMap.value.get(term.id);
          if (!loadState) {
            return false;
          }
          return ["complete", "error"].includes(loadState);
        })
      );
    }),
    allCourses: computed(() => {
      const courses: TimelessCourse[] = [
        ...state.coursesByInstructorTermMap.value.values(),
      ]
        .flat()
        .map(toTimelessCourse);
      // remove duplicates
      return uniqBy(courses, "shortCode").sort((a, b) => {
        // sort by course code
        return a.shortCode.localeCompare(b.shortCode);
      });
    }),
    courseTypesMap: computed(() => {
      const map = new Map<Course["courseType"], number>();
      getters.allCourses.value.forEach((course) => {
        const count = map.get(course.courseType) ?? 0;
        map.set(course.courseType, count + 1);
      });
      return map;
    }),

    courseLevelsMap: computed(() => {
      const map = new Map<Course["courseLevel"], number>();
      getters.allCourses.value.forEach((course) => {
        const count = map.get(course.courseLevel) ?? 0;
        map.set(course.courseLevel, count + 1);
      });
      return map;
    }),

    allInstructors: computed(() => {
      console.log("allInstructors computed");
      const instructors = [
        ...state.instructorsByCourseTermMap.value.values(),
      ].flat();
      // remove duplicates
      return uniqBy(instructors, "id").sort(sortByName);
    }),

    instructorLookup: computed(() => {
      const lookup = new Map<Instructor["id"], Instructor>();
      getters.allInstructors.value.forEach((instructor) => {
        lookup.set(instructor.id, instructor);
      });
      return lookup;
    }),

    instructorAppointmentTypesMap: computed(() => {
      const map = new Map<Instructor["academicAppointment"], number>();
      getters.allInstructors.value.forEach((instructor) => {
        const count = map.get(instructor.academicAppointment) ?? 0;
        map.set(instructor.academicAppointment, count + 1);
      });
      return map;
    }),
  };

  const actions = {
    async init(groupId: Group["id"]) {
      actions.resetState();

      state.groupId.value = groupId;
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);

      watch(
        terms,
        () => {
          if (!state.groupId.value) {
            throw new Error("Cannot initialize without a `groupId`");
          }

          if (!terms.value.length) return;
          // initialize the load state
          terms.value.forEach((term) => {
            state.termLoadStateMap.value.set(term.id, "idle");
          });

          pMap(
            terms.value,
            async (term) => {
              if (!state.groupId.value) {
                throw new Error("Cannot initialize without a `groupId`");
              }
              try {
                state.termLoadStateMap.value.set(term.id, "loading");
                const {
                  coursesByInstructorAndTermMap,
                  instructorsByCourseAndTermMap,
                } = await fetchCoursesAndInstructorsForTerm(
                  state.groupId.value,
                  term.id,
                );
                // do this as one batch update to avoid
                // triggering multiple re-renders
                state.coursesByInstructorTermMap.value = new Map([
                  ...state.coursesByInstructorTermMap.value,
                  ...coursesByInstructorAndTermMap,
                ]);
                state.instructorsByCourseTermMap.value = new Map([
                  ...state.instructorsByCourseTermMap.value,
                  ...instructorsByCourseAndTermMap,
                ]);
              } catch (e) {
                state.termLoadStateMap.value.set(term.id, "error");
              } finally {
                state.termLoadStateMap.value.set(term.id, "complete");
              }
            },
            { concurrency: 5 },
          );
        },
        { immediate: true },
      );
    },
    getCoursesForInstructorPerTerm(instructorId: Instructor["id"]) {
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);
      return terms.value.map((term) => {
        const key =
          `${instructorId}-${term.id}` as CoursesByInstructorAndTermKey;
        return (
          state.coursesByInstructorTermMap.value
            .get(key)
            ?.sort((a, b) => a.shortCode.localeCompare(b.shortCode)) ?? []
        );
      });
    },
    getInstructorsForCoursePerTerm(courseShortCode: CourseShortCode) {
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);
      return terms.value.map((term) => {
        const key =
          `${courseShortCode}-${term.id}` as InstructorsByCourseAndTermKey;
        return (
          state.instructorsByCourseTermMap.value.get(key)?.sort(sortByName) ??
          []
        );
      });
    },

    getLeavesForInstructorPerTerm(instructorId: Instructor["id"]) {
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);
      const instructor = getters.instructorLookup.value.get(instructorId);
      if (!instructor) {
        throw new Error(`Cannot find instructor with id: ${instructorId}`);
      }

      return terms.value.map((term) =>
        selectInstructorTermLeaves(instructor, term),
      );
    },
    resetState() {
      state.groupId.value = null;
      state.instructorsByCourseTermMap.value = new Map();
      state.coursesByInstructorTermMap.value = new Map();
      state.termLoadStateMap.value = new Map();
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
});

// this is a convenience function that allows us to
// automatically initialize a store for a given group
export const useGroupCourseHistoryStore = (groupId: Group["id"]) => {
  const store = useStore();
  if (store.groupId !== groupId) {
    store.init(groupId);
  }

  return store;
};
