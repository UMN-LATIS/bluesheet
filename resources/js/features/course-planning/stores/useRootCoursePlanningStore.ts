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
import { Group, SelectOption, Term } from "@/types";

interface RootCoursePlanningState {
  activeGroupId: Group["id"] | null;
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
      activeGroupId: null,
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
        state.activeGroupId = groupId;
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

      setExcludedCourseTypes(courseTypes: T.Course["courseType"][]) {
        state.filters.excludedCourseTypes = new Set(courseTypes);
      },

      setExcludedCourseLevels(courseLevels: T.Course["courseLevel"][]) {
        state.filters.excludedCourseLevels = new Set(courseLevels);
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

      isPersonEnrolledInVisibleSection(emplid: T.Person["emplid"]) {
        if (!state.activeGroupId) {
          throw new Error("active group id is not set");
        }

        const enrollmentForPersonInGroup =
          stores.enrollmentStore.getEnrollmentsForEmplIdInGroup(
            emplid,
            state.activeGroupId,
          );
        const sectionIds = enrollmentForPersonInGroup.map((e) => e.sectionId);
        const sections = sectionIds
          .map((id) => stores.courseSectionStore.getCourseSection(id))
          .filter(Boolean) as T.CourseSection[];

        const visibleSections = sections.filter(methods.isSectionVisible);
        return visibleSections.length > 0;
      },

      isPersonVisible(person: T.Person) {
        if (!state.activeGroupId) {
          throw new Error("active group id is not set");
        }

        const isAcadApptVisible = !state.filters.excludedAcadAppts.has(
          person.academicAppointment,
        );
        const hasVisibleSection = methods.isPersonEnrolledInVisibleSection(
          person.emplid,
        );

        return isAcadApptVisible && hasVisibleSection;
      },

      isTermVisible(term: Term) {
        if (!state.filters.startTermId || !state.filters.endTermId) {
          return true;
        }

        // term ids are well ordered, so we can just check if the term id is
        // between the start and end term ids
        return (
          state.filters.startTermId <= term.id &&
          term.id <= state.filters.endTermId
        );
      },

      isSectionVisible(section: T.CourseSection) {
        const course = stores.courseStore.getCourse(section.courseId);
        if (!course) {
          return false;
        }

        const isCourseTypeVisible = !state.filters.excludedCourseTypes.has(
          course.courseType,
        );
        const isCourseLevelVisible = !state.filters.excludedCourseLevels.has(
          course.courseLevel,
        );

        return isCourseTypeVisible && isCourseLevelVisible;
      },

      isCurrentTerm: stores.termsStore.isCurrentTerm,
      getGroup: stores.groupStore.getGroup,
      getAcadApptCountsForGroup: stores.personStore.getAcadApptCountsForGroup,
      getCourseTypeCountsForGroup:
        stores.courseStore.getCourseTypeCountsForGroup,
      getCourseLevelCountsForGroup:
        stores.courseStore.getCourseLevelCountsForGroup,
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
