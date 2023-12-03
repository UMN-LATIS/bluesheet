import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as T from "./plannedCourseTypes";

export const useCourseSectionStore = defineStore("couseSection", () => {
  const state = reactive({
    courseSectionLookup: {} as Record<
      T.CourseSection["id"],
      T.CourseSection | undefined
    >,
  });

  const getters = {
    courseSectionLookup: computed(() => state.courseSectionLookup),
  };

  const actions = {};

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
