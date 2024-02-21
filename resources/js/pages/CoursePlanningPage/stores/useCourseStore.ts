import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as api from "@/api";
import { countBy, debounce, keyBy } from "lodash";
import * as T from "@/types";

interface CourseStoreState {
  activeGroupId: number | null;
  courseLookup: Record<T.Course["id"], T.Course | undefined>;
  filters: {
    excludedCourseTypes: Set<string>;
    excludedCourseLevels: Set<string>;
    search: string;
  };
}

export const useCourseStore = defineStore("course", () => {
  const state = reactive<CourseStoreState>({
    activeGroupId: null,
    courseLookup: {},
    filters: {
      excludedCourseTypes: new Set(),
      excludedCourseLevels: new Set(),
      search: "",
    },
  });

  const getters = {
    allCourses: computed(
      (): T.Course[] =>
        Object.values(state.courseLookup).filter(Boolean) as T.Course[],
    ),
    courseTypeCounts: computed((): Record<T.Course["courseType"], number> => {
      const courseTypes = getters.allCourses.value.map((c) => c.courseType);
      return countBy(courseTypes);
    }),
    courseLevelCounts: computed((): Record<T.Course["courseLevel"], number> => {
      const courseLevels = getters.allCourses.value.map((c) => c.courseLevel);
      return countBy(courseLevels);
    }),
    getCourse: computed(
      () =>
        (id: T.Course["id"]): T.Course | null =>
          state.courseLookup[id] ?? null,
    ),
    allCourseTypes: computed((): T.Course["courseType"][] => {
      return Object.keys(getters.courseTypeCounts.value);
    }),
    allCourseLevels: computed((): T.Course["courseLevel"][] => {
      return Object.keys(getters.courseLevelCounts.value);
    }),
    doesCourseMatchSearch: computed(() => (course: T.Course): boolean => {
      if (!course) {
        return false;
      }

      const courseCode = `${course.subject} ${course.catalogNumber}`;

      return (
        state.filters.search === "" ||
        courseCode.toLowerCase().includes(state.filters.search.toLowerCase())
      );
    }),
    doesCourseHaveVisibleType: computed(() => (course: T.Course): boolean => {
      if (!course) {
        return false;
      }

      return !state.filters.excludedCourseTypes.has(course.courseType);
    }),
    doesCourseHaveVisibleLevel: computed(() => (course: T.Course): boolean => {
      if (!course) {
        return false;
      }

      return !state.filters.excludedCourseLevels.has(course.courseLevel);
    }),
  };

  const actions = {
    init(groupId: T.Group["id"]): Promise<void> {
      state.activeGroupId = groupId;
      return actions.fetchCoursesForGroup(groupId);
    },

    async fetchCoursesForGroup(groupId: number): Promise<void> {
      const courses = await api.fetchCoursesForGroup(groupId);
      state.courseLookup = keyBy<T.Course>(courses, "id");
    },
    toggleAllCourseTypes() {
      const areAllExcluded = getters.allCourseTypes.value.every((courseType) =>
        state.filters.excludedCourseTypes.has(courseType),
      );

      if (areAllExcluded) {
        state.filters.excludedCourseTypes = new Set();
        return;
      }

      state.filters.excludedCourseTypes = new Set(getters.allCourseTypes.value);
    },

    toggleAllCourseLevels() {
      const areAllExcluded = getters.allCourseLevels.value.every(
        (courseLevel) => state.filters.excludedCourseLevels.has(courseLevel),
      );

      if (areAllExcluded) {
        state.filters.excludedCourseLevels = new Set();
        return;
      }

      state.filters.excludedCourseLevels = new Set(
        getters.allCourseLevels.value,
      );
    },

    setSearchFilter: debounce((search: string) => {
      state.filters.search = search;
    }),

    resetFilters() {
      state.filters.excludedCourseTypes = new Set();
      state.filters.excludedCourseLevels = new Set();
      // state.filters.search = "";
    },

    async addCourse(course: T.Course) {
      if (!state.activeGroupId) {
        throw new Error("No active group");
      }

      state.courseLookup = {
        ...state.courseLookup,
        [course.id]: course,
      };

      try {
        const courseFromApi = await api.addUnofficialCourseToGroup(
          state.activeGroupId,
          course,
        );

        // update with the course from the API
        state.courseLookup = {
          ...state.courseLookup,
          [course.id]: courseFromApi,
        };
      } catch (e) {
        // rollback
        state.courseLookup = {
          ...state.courseLookup,
          [course.id]: undefined,
        };

        throw new Error(
          `Failed to create new unofficial course ${course.id}: ${e}`,
        );
      }
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
