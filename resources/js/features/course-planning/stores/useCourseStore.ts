import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as T from "../coursePlanningTypes";
import * as api from "../coursePlanningApi";
import { countBy } from "lodash";

interface CourseStoreState {
  courseLookup: Record<T.Course["id"], T.Course | undefined>;
  courseIdsByGroup: Record<number, T.Course["id"][] | undefined>;
}

export const useCourseStore = defineStore("course", () => {
  const state = reactive<CourseStoreState>({
    courseLookup: {},
    courseIdsByGroup: {},
  });

  const getters = {
    allCourses: computed(() => Object.values(state.courseLookup)),
  };

  const actions = {
    async fetchCoursesForGroup(groupId: number) {
      const courses = await api.fetchCoursesForGroup(groupId);

      // update the course lookup in one fell swoop
      const updatedCourseLookup = {
        ...state.courseLookup,
        ...Object.fromEntries(courses.map((course) => [course.id, course])),
      };

      state.courseLookup = updatedCourseLookup;

      // update courseIdsByGroup list
      state.courseIdsByGroup[groupId] = courses.map((course) => course.id);
    },

    getCourse(id: T.Course["id"]) {
      return state.courseLookup[id];
    },

    getCoursesByGroup(groupId: number) {
      const courseIds = state.courseIdsByGroup[groupId] ?? [];
      return courseIds
        .map((courseId) => state.courseLookup[courseId])
        .filter(Boolean) as T.Course[];
    },

    getCourseTypeCountsForGroup(
      groupId: number,
    ): Record<T.Course["courseType"], number> {
      const courses = actions.getCoursesByGroup(groupId);
      const courseTypes = courses.map((c) => c.courseType);
      return countBy(courseTypes);
    },

    getCourseLevelCountsForGroup(
      groupId: number,
    ): Record<T.Course["courseLevel"], number> {
      const courses = actions.getCoursesByGroup(groupId);
      const courseLevels = courses.map((c) => c.courseLevel);
      return countBy(courseLevels);
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
