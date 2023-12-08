import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import { Group, Term } from "@/types";
import * as T from "@/types";
import * as api from "@/api";

interface CourseSectionStoreState {
  sectionIdsByGroup: Record<Group["id"], T.CourseSection["id"][] | undefined>;
  sectionLookup: Record<T.CourseSection["id"], T.CourseSection | undefined>;
}

export const useCourseSectionStore = defineStore("couseSection", () => {
  const state = reactive<CourseSectionStoreState>({
    sectionLookup: {},
    sectionIdsByGroup: {},
  });

  const getters = {
    allSections: computed(
      (): T.CourseSection[] =>
        Object.values(state.sectionLookup).filter(Boolean) as T.CourseSection[],
    ),
    sectionsByTermId: computed((): Record<Term["id"], T.CourseSection[]> => {
      const sectionsByTerm: Record<Term["id"], T.CourseSection[]> = {};

      getters.allSections.value.forEach((section) => {
        sectionsByTerm[section.termId] = [
          ...(sectionsByTerm[section.termId] ?? []),
          section,
        ];
      });
      return sectionsByTerm;
    }),
    sectionsByCourseId: computed(
      (): Record<T.Course["id"], T.CourseSection[]> => {
        const sectionsByCourse: Record<T.Course["id"], T.CourseSection[]> = {};

        getters.allSections.value.forEach((section) => {
          sectionsByCourse[section.courseId] = [
            ...(sectionsByCourse[section.courseId] ?? []),
            section,
          ];
        });
        return sectionsByCourse;
      },
    ),
    sectionsByGroupId: computed((): Record<Group["id"], T.CourseSection[]> => {
      const sectionsByGroup: Record<Group["id"], T.CourseSection[]> = {};

      Object.entries(state.sectionIdsByGroup).forEach(
        ([groupId, sectionIds]) => {
          if (!sectionIds) return;

          sectionsByGroup[groupId] = sectionIds.map(
            (sectionId) => state.sectionLookup[sectionId],
          ) as T.CourseSection[];
        },
      );
      return sectionsByGroup;
    }),
  };

  const actions = {
    async fetchCourseSectionsForGroup(groupId: number): Promise<void> {
      const courseSections = await api.fetchCourseSectionsForGroup(groupId);

      // update the course section lookup in one fell swoop
      const updatedCourseSectionLookup = {
        ...state.sectionLookup,
        ...Object.fromEntries(
          courseSections.map((courseSection) => [
            courseSection.id,
            courseSection,
          ]),
        ),
      };

      state.sectionLookup = updatedCourseSectionLookup;

      // update sectionIdsByGroup list
      state.sectionIdsByGroup[groupId] = courseSections.map(
        (courseSection) => courseSection.id,
      );
    },
  };

  const methods = {
    getSection(sectionId: T.CourseSection["id"]): T.CourseSection | null {
      return state.sectionLookup[sectionId] ?? null;
    },
    getSectionsForGroup(groupId: Group["id"]): T.CourseSection[] {
      return getters.sectionsByGroupId.value[groupId] ?? [];
    },
    getSectionsForCourse(courseId: T.Course["id"]): T.CourseSection[] {
      return getters.sectionsByCourseId.value[courseId] ?? [];
    },

    getSectionsForTerm(termId: Term["id"]): T.CourseSection[] {
      return getters.sectionsByTermId.value[termId] ?? [];
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
