import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import { Group, Term } from "@/types";
import * as T from "../coursePlanningTypes";
import * as api from "../coursePlanningApi";

interface CourseSectionStoreState {
  sectionIdsByGroup: Record<Group["id"], T.CourseSection["id"][] | undefined>;
  courseSectionLookup: Record<
    T.CourseSection["id"],
    T.CourseSection | undefined
  >;
}

export const useCourseSectionStore = defineStore("couseSection", () => {
  const state = reactive<CourseSectionStoreState>({
    courseSectionLookup: {},
    sectionIdsByGroup: {},
  });

  const getters = {
    allCourseSections: computed(() => Object.values(state.courseSectionLookup)),
  };

  const actions = {
    async fetchCourseSectionsForGroup(groupId: number) {
      const courseSections = await api.fetchCourseSectionsForGroup(groupId);

      // update the course section lookup in one fell swoop
      const updatedCourseSectionLookup = {
        ...state.courseSectionLookup,
        ...Object.fromEntries(
          courseSections.map((courseSection) => [
            courseSection.id,
            courseSection,
          ]),
        ),
      };

      state.courseSectionLookup = updatedCourseSectionLookup;

      // update sectionIdsByGroup list
      state.sectionIdsByGroup[groupId] = courseSections.map(
        (courseSection) => courseSection.id,
      );
    },
  };

  const methods = {
    getCourseSection(sectionId: T.CourseSection["id"]) {
      return state.courseSectionLookup[sectionId] ?? null;
    },
    getCoursesSectionsForGroup(groupId: Group["id"]) {
      const sectionIds = state.sectionIdsByGroup[groupId] ?? [];
      return sectionIds.map(
        (sectionId) => state.courseSectionLookup[sectionId],
      );
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
