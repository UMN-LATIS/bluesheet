import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as T from "../coursePlanningTypes";
import { usePersonStore } from "./usePersonStore";
import { useEnrollmentStore } from "./useEnrollmentStore";
import { useCourseSectionStore } from "./useCourseSectionStore";
import { useCourseStore } from "./useCourseStore";
import { useGroupStore } from "@/stores/useGroupStore";
import { useTermsStore } from "@/stores/useTermsStore";

export const useRootCoursePlanningStore = defineStore(
  "rootCoursePlanning",
  () => {
    const state = reactive({
      isInPlanningMode: false,
    });

    const stores = {
      personStore: usePersonStore(),
      enrollmentStore: useEnrollmentStore(),
      courseStore: useCourseStore(),
      groupStore: useGroupStore(),
      termsStore: useTermsStore(),
      courseSectionStore: useCourseSectionStore(),
    };

    const getters = {
      terms: stores.termsStore.terms,
      currentTerm: stores.termsStore.currentTerm,
    };

    const actions = {
      initGroup(groupId: number) {
        return Promise.all([
          stores.termsStore.init(),
          stores.groupStore.fetchGroup(groupId),
          stores.personStore.fetchPeopleForGroup(groupId),
          stores.enrollmentStore.fetchEnrollmentsForGroup(groupId),
          stores.courseStore.fetchCoursesForGroup(groupId),
          stores.courseSectionStore.fetchCourseSectionsForGroup(groupId),
        ]);
      },
    };

    const methods = {
      getSectionsForPerson(personId: number): T.CourseSection[] {
        const enrollmentStore = useEnrollmentStore();
        const enrollments = enrollmentStore.getEnrollmentsForPerson(personId);

        const sectionIds = enrollments.map((e) => e.sectionId);

        const sectionStore = useCourseSectionStore();
        return sectionIds
          .map(sectionStore.getCourseSection)
          .filter(Boolean) as T.CourseSection[];
      },

      getSectionsForPersonInTerm(personId: number, termId: number) {
        const sections = methods.getSectionsForPerson(personId);

        return sections.filter((section) => section.termId === termId);
      },

      getPeopleInGroupWithRoles(groupId: number, roles: T.EnrollmentRole[]) {
        const enrollmentsForGroup =
          stores.enrollmentStore.getEnrollmentsForGroup(groupId);

        // filter out enrollments that don't match the role
        const enrollmentsForGroupWithRole = enrollmentsForGroup.filter(
          (enrollment) => roles.includes(enrollment.role),
        );
        console.log("enrollmentsForGroup", enrollmentsForGroupWithRole);

        // get the people for these enrollments
        return enrollmentsForGroupWithRole
          .map((e) => stores.personStore.getPerson(e.personId))
          .filter(Boolean) as T.Person[];
      },

      isCurrentTerm: stores.termsStore.isCurrentTerm,
      getGroup: stores.groupStore.getGroup,
    };

    return {
      ...toRefs(state),
      ...stores,
      ...getters,
      ...actions,
      ...methods,
    };
  },
);
