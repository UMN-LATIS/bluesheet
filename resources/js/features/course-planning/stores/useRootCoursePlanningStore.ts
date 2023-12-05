import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as T from "../coursePlanningTypes";
import { usePersonStore } from "./usePersonStore";
import { useEnrollmentStore } from "./useEnrollmentStore";
import { useCourseSectionStore } from "./useCourseSectionStore";
import { useCourseStore } from "./useCourseStore";
import { useGroupStore } from "@/stores/useGroupStore";
import { useTermsStore } from "@/stores/useTermsStore";
import { uniq } from "lodash";
import { sortByName } from "@/utils";
import { SelectOption, Term } from "@/types";

interface RootCoursePlanningState {
  isInPlanningMode: boolean;
  filters: {
    startTermId: number | null;
    endTermId: number | null;
    excludedCourseTypes: Set<string>;
    excludedCourseLevels: Set<string>;
    excludedAcadAppts: Set<string>;
  };
}

export const useRootCoursePlanningStore = defineStore(
  "rootCoursePlanning",
  () => {
    const stores = {
      personStore: usePersonStore(),
      enrollmentStore: useEnrollmentStore(),
      courseStore: useCourseStore(),
      groupStore: useGroupStore(),
      termsStore: useTermsStore(),
      courseSectionStore: useCourseSectionStore(),
    };

    const state = reactive<RootCoursePlanningState>({
      isInPlanningMode: false,
      filters: {
        startTermId: null,
        endTermId: null,
        excludedCourseTypes: new Set(),
        excludedCourseLevels: new Set(),
        excludedAcadAppts: new Set(),
      },
    });

    const getters = {
      terms: computed(() => stores.termsStore.terms),

      currentTerm: computed(() => stores.termsStore.currentTerm),

      /**
       * a list of terms for a term select dropdown
       */
      termSelectOptions: computed((): SelectOption[] =>
        stores.termsStore.terms.map((term) => ({
          text: term.name,
          value: term.id,
        })),
      ),

      earliestTerm: computed(() => stores.termsStore.earliestTerm),
      latestTerm: computed(() => stores.termsStore.latestTerm),
    };

    const actions = {
      async initGroup(groupId: number) {
        await Promise.all([
          stores.termsStore.init(),
          stores.groupStore.fetchGroup(groupId),
          stores.personStore.fetchPeopleForGroup(groupId),
          stores.enrollmentStore.fetchEnrollmentsForGroup(groupId),
          stores.courseStore.fetchCoursesForGroup(groupId),
          stores.courseSectionStore.fetchCourseSectionsForGroup(groupId),
        ]);

        this.setStartTermId(getters.earliestTerm.value?.id ?? null);
        this.setEndTermId(getters.latestTerm.value?.id ?? null);
      },

      setStartTermId(termId: Term["id"] | null) {
        state.filters.startTermId = termId;
      },

      setEndTermId(termId: Term["id"] | null) {
        state.filters.endTermId = termId;
      },

      setExcludedAcadAppts(acadAppts: T.Person["academicAppointment"][]) {
        state.filters.excludedAcadAppts = new Set(acadAppts);
      },

      toggleAcadApptFilter(acadAppt: T.Person["academicAppointment"]) {
        state.filters.excludedAcadAppts.has(acadAppt)
          ? state.filters.excludedAcadAppts.delete(acadAppt)
          : state.filters.excludedAcadAppts.add(acadAppt);
      },
    };

    const methods = {
      getSectionsForEmplId(emplId: T.Person["emplid"]): T.CourseSection[] {
        const enrollmentStore = useEnrollmentStore();
        const enrollments = enrollmentStore.getEnrollmentsForEmplId(emplId);

        const sectionIds = enrollments.map((e) => e.sectionId);

        const sectionStore = useCourseSectionStore();
        return sectionIds
          .map(sectionStore.getCourseSection)
          .filter(Boolean) as T.CourseSection[];
      },

      getSectionsForEmplIdInTerm(emplId: T.Person["emplid"], termId: number) {
        const sections = methods.getSectionsForEmplId(emplId);
        return sections.filter((section) => section.termId === termId);
      },

      getPeopleInGroupWithRoles(groupId: number, roles: T.EnrollmentRole[]) {
        const enrollmentsForGroup =
          stores.enrollmentStore.getEnrollmentsForGroup(groupId);

        // filter out enrollments that don't match the role
        const enrollmentsForGroupWithRole = enrollmentsForGroup.filter(
          (enrollment) => roles.includes(enrollment.role),
        );

        const uniqEmplids = uniq(
          enrollmentsForGroupWithRole.map((e) => e.emplId),
        );

        // get the people for these enrollments
        const people = uniqEmplids
          .map((emplid) => stores.personStore.getPersonByEmplId(emplid))
          .filter(Boolean) as T.Person[];

        return people.sort(sortByName);
      },

      isPersonVisible(person: T.Person) {
        return !state.filters.excludedAcadAppts.has(person.academicAppointment);
      },

      isCurrentTerm: stores.termsStore.isCurrentTerm,
      getGroup: stores.groupStore.getGroup,
      getAcadApptCountsForGroup: stores.personStore.getAcadApptCountsForGroup,
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
