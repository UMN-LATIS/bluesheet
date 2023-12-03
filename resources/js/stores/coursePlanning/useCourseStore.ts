import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import { Course } from "./plannedCourseTypes";

interface CourseStoreState {
  courseLookup: Record<Course["id"], Course | undefined>;
}

export const useCourseStore = defineStore("course", () => {
  const state = reactive({
    courseLookup: {},
  });

  const getters = {};
  const actions = {};

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
