import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as T from "../coursePlanningTypes";
import { usePersonStore } from "./usePersonStore";
import { useEnrollmentStore } from "./useEnrollmentStore";
import { useCourseSectionStore } from "./useCourseSectionStore";
import { useCourseStore } from "./useCourseStore";
import { useGroupStore } from "@/stores/useGroupStore";
import { useTermsStore } from "@/stores/useTermsStore";
import { debounce, uniq } from "lodash";
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
    search: string;
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
        search: "",
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
      acadApptCounts: computed(
        (): Record<T.Person["academicAppointment"], number> =>
          state.activeGroupId
            ? stores.personStore.getAcadApptCountsForGroup(state.activeGroupId)
            : {},
      ),
      courseTypeCounts: computed(
        (): Record<T.Course["courseType"], number> =>
          state.activeGroupId
            ? stores.courseStore.getCourseTypeCountsForGroup(
                state.activeGroupId,
              )
            : {},
      ),
      courseLevelCounts: computed(
        (): Record<T.Course["courseLevel"], number> =>
          state.activeGroupId
            ? stores.courseStore.getCourseLevelCountsForGroup(
                state.activeGroupId,
              )
            : {},
      ),

      sortedCourseLevels: computed((): [T.Course["courseLevel"], number][] => {
        const courseLevelCounts: Record<T.Course["courseLevel"], number> =
          getters.courseLevelCounts.value;
        return Object.entries(courseLevelCounts).sort((a, b) => {
          return a[0].localeCompare(b[0]);
        });
      }),

      sortedCourseTypes: computed((): [T.Course["courseType"], number][] => {
        const courseTypeCounts: Record<T.Course["courseType"], number> =
          getters.courseTypeCounts.value;
        return Object.entries(courseTypeCounts).sort((a, b) => {
          return a[0].localeCompare(b[0]);
        });
      }),

      sortedAcadAppts: computed(
        (): [T.Person["academicAppointment"], number][] => {
          const acadApptCounts: Record<
            T.Person["academicAppointment"],
            number
          > = getters.acadApptCounts.value;
          return Object.entries(acadApptCounts).sort((a, b) => {
            return a[0].localeCompare(b[0]);
          });
        },
      ),
      allAcadApptTypes: computed((): T.Person["academicAppointment"][] =>
        Object.keys(getters.acadApptCounts.value),
      ),
      allCourseTypes: computed((): T.Course["courseType"][] =>
        Object.keys(getters.courseTypeCounts.value),
      ),
      allCourseLevels: computed((): T.Course["courseLevel"][] =>
        Object.keys(getters.courseLevelCounts.value),
      ),
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

      toggleAllAcadAppts() {
        const areAllExcluded = getters.allAcadApptTypes.value.every(
          (acadAppt) => state.filters.excludedAcadAppts.has(acadAppt),
        );

        if (areAllExcluded) {
          state.filters.excludedAcadAppts = new Set();
          return;
        }

        state.filters.excludedAcadAppts = new Set(
          getters.allAcadApptTypes.value,
        );
      },

      toggleAllCourseTypes() {
        const areAllExcluded = getters.allCourseTypes.value.every(
          (courseType) => state.filters.excludedCourseTypes.has(courseType),
        );

        if (areAllExcluded) {
          state.filters.excludedCourseTypes = new Set();
          return;
        }

        state.filters.excludedCourseTypes = new Set(
          getters.allCourseTypes.value,
        );
      },

      toggleAllCourseLevels() {
        const areAllExcluded = getters.allCourseLevels.value.every(
          (courseLevel) => state.filters.excludedCourseLevels.has(courseLevel),
        );

        if (areAllExcluded) {
          state.filters.excludedCourseLevels = new Set();
          return;
        }

        state.filters.excludedCourseLevels = new Set(
          getters.allCourseLevels.value,
        );
      },

      toggleAcadApptFilter(acadAppt: T.Person["academicAppointment"]) {
        state.filters.excludedAcadAppts.has(acadAppt)
          ? state.filters.excludedAcadAppts.delete(acadAppt)
          : state.filters.excludedAcadAppts.add(acadAppt);
      },

      setSearchFilter: debounce((search: string) => {
        state.filters.search = search;
      }, 500),
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

        return (
          isAcadApptVisible &&
          hasVisibleSection &&
          (methods.isPersonMatchingSearch(person) ||
            methods.isPersonEnrolledInCourseMatchingSearch(person))
        );
      },

      isPersonMatchingSearch(person: T.Person) {
        return (
          state.filters.search === "" ||
          person.displayName
            .toLowerCase()
            .includes(state.filters.search.toLowerCase())
        );
      },

      isPersonEnrolledInCourseMatchingSearch(person: T.Person) {
        const sections = methods.getSectionsForEmplId(person.emplid);
        const courses = sections
          .map((section) => stores.courseStore.getCourse(section.courseId))
          .filter(Boolean) as T.Course[];

        const courseCodes = courses.map(
          (course) => `${course.subject} ${course.catalogNumber}`,
        );
        const uniqueCourseCodes = uniq(courseCodes);

        return uniqueCourseCodes.some((courseCode) =>
          courseCode.toLowerCase().includes(state.filters.search.toLowerCase()),
        );
      },

      isSectionMatchingSearch(section: T.CourseSection) {
        const course = stores.courseStore.getCourse(section.courseId);
        if (!course) {
          return false;
        }

        const courseCode = `${course.subject} ${course.catalogNumber}`;

        return (
          state.filters.search === "" ||
          courseCode.toLowerCase().includes(state.filters.search.toLowerCase())
        );
      },

      isTermVisible(termId: Term["id"]) {
        if (!state.filters.startTermId || !state.filters.endTermId) {
          return true;
        }

        // term ids are well ordered, so we can just check if the term id is
        // between the start and end term ids
        return (
          state.filters.startTermId <= termId &&
          termId <= state.filters.endTermId
        );
      },

      isSectionVisible(section: T.CourseSection) {
        const course = stores.courseStore.getCourse(section.courseId);
        if (!course) {
          return false;
        }

        const isSectionTermVisible = methods.isTermVisible(section.termId);

        const isCourseTypeVisible = !state.filters.excludedCourseTypes.has(
          course.courseType,
        );
        const isCourseLevelVisible = !state.filters.excludedCourseLevels.has(
          course.courseLevel,
        );

        return (
          isSectionTermVisible && isCourseTypeVisible && isCourseLevelVisible
        );
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
