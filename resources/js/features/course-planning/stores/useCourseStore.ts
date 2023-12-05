import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import { Course } from "../coursePlanningTypes";
import * as api from "../coursePlanningApi";

interface CourseStoreState {
  courseLookup: Record<Course["id"], Course | undefined>;
  courseIdsByGroup: Record<number, Course["id"][] | undefined>;
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

    getCourse(id: Course["id"]) {
      return state.courseLookup[id];
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
