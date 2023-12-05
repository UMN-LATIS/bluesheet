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

    courseSectionsInGroup: (groupId: number) =>
      computed((): T.CourseSection[] => {
        const groupSectionIds = state.sectionIdsByGroup[groupId];
        if (!groupSectionIds) return [];

        return groupSectionIds.map((sectionId) => {
          const section = state.courseSectionLookup[sectionId];
          if (!section) throw new Error(`section ${sectionId} not found`);
          return section;
        });
      }),

    sectionsByTermForGroup: (groupId: number) =>
      computed(() => {
        const sections = getters.courseSectionsInGroup(groupId).value;

        const sectionsByTerm: Record<Term["id"], T.CourseSection["id"][]> = {};

        sections.forEach((section) => {
          if (!sectionsByTerm[section.termId]) {
            sectionsByTerm[section.termId] = [];
          }

          sectionsByTerm[section.termId].push(section.id);
        });

        return sectionsByTerm;
      }),
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
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
