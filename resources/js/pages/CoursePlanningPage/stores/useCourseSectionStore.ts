import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as T from "@/types";
import * as api from "@/api";
import { keyBy, groupBy } from "lodash";

interface CourseSectionStoreState {
  activeGroupId: T.Group["id"] | null;
  sectionLookup: Record<T.CourseSection["id"], T.CourseSection | undefined>;
}

export const useCourseSectionStore = defineStore("couseSection", () => {
  const state = reactive<CourseSectionStoreState>({
    activeGroupId: null,
    sectionLookup: {},
  });

  const getters = {
    allSections: computed(
      (): T.CourseSection[] =>
        Object.values(state.sectionLookup).filter(Boolean) as T.CourseSection[],
    ),
    getSectionsByTermId: computed(() => {
      const lookupByTermId = groupBy<T.CourseSection>(
        getters.allSections.value,
        "termId",
      );

      return (termId: T.Term["id"]): T.CourseSection[] =>
        lookupByTermId[termId] ?? [];
    }),
    getSectionsByCourseId: computed(() => {
      const lookup = groupBy<T.CourseSection>(
        getters.allSections.value,
        "courseId",
      );
      return (courseId: T.Course["id"]): T.CourseSection[] =>
        lookup[courseId] ?? [];
    }),
    getSection: computed(
      () =>
        (sectionId: T.CourseSection["id"]): T.CourseSection | null => {
          return state.sectionLookup[sectionId] ?? null;
        },
    ),
  };

  const actions = {
    async init(groupId: T.Group["id"]): Promise<void> {
      state.activeGroupId = groupId;
      return actions.fetchCourseSections();
    },
    async fetchCourseSections(): Promise<void> {
      if (!state.activeGroupId) {
        throw new Error("activeGroupId is null");
      }
      const courseSections = await api.fetchCourseSectionsForGroup(
        state.activeGroupId,
      );

      state.sectionLookup = keyBy<T.CourseSection>(courseSections, "id");
    },

    async createSection({
      course,
      term,
    }: {
      course: T.Course;
      term: T.Term;
    }): Promise<T.CourseSection> {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }

      const section = await api.createCourseSectionInGroup({
        course,
        term,
        groupId: state.activeGroupId,
      });
      state.sectionLookup[section.id] = section;
      return section;
    },
    async updateSection(section: T.CourseSection): Promise<T.CourseSection> {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }

      const updatedSection = await api.updateSectionInGroup(
        section,
        state.activeGroupId,
      );
      state.sectionLookup[section.id] = updatedSection;
      return updatedSection;
    },

    async removeSection(section: T.CourseSection): Promise<void> {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }

      await api.removeSectionFromGroup(section, state.activeGroupId);
      delete state.sectionLookup[section.id];
    },
  };

  const methods = {};

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
