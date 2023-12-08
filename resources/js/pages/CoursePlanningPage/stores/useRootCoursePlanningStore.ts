import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import { usePersonStore } from "./usePersonStore";
import { useEnrollmentStore } from "./useEnrollmentStore";
import { useCourseSectionStore } from "./useCourseSectionStore";
import { useCourseStore } from "./useCourseStore";
import { useGroupStore } from "@/stores/useGroupStore";
import { useTermsStore } from "@/stores/useTermsStore";
import { useLeaveStore } from "./useLeaveStore";
import { debounce, uniq } from "lodash";
import { sortByName } from "@/utils";
import * as T from "@/types";

interface RootCoursePlanningState {
  activeGroupId: T.Group["id"] | null;
  isInPlanningMode: boolean;
  filters: {
    startTermId: number | null;
    endTermId: number | null;
    excludedCourseTypes: Set<string>;
    excludedCourseLevels: Set<string>;
    excludedAcadAppts: Set<string>;
    search: string;
    includedEnrollmentRoles: T.EnrollmentRole[];
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
      leaveStore: useLeaveStore(),
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
        includedEnrollmentRoles: ["PI"],
      },
    });

    const getters = {
      terms: computed((): T.Term[] => stores.termsStore.terms),
      courses: computed((): T.Course[] =>
        stores.courseStore.getCoursesForGroup(state.activeGroupId ?? 0),
      ),
      people: computed((): T.Person[] =>
        stores.personStore.getPeopleInGroup(state.activeGroupId ?? 0),
      ),

      currentTerm: computed((): T.Term | null => stores.termsStore.currentTerm),

      /**
       * a list of terms for a term select dropdown
       */
      termSelectOptions: computed((): T.SelectOption[] =>
        stores.termsStore.terms.map((term) => ({
          text: term.name,
          value: term.id,
        })),
      ),

      earliestTerm: computed(
        (): T.Term | null => stores.termsStore.earliestTerm,
      ),
      latestTerm: computed((): T.Term | null => stores.termsStore.latestTerm),
      visibleTerms: computed((): T.Term[] => {
        return stores.termsStore.terms.filter((term) =>
          methods.isTermVisible(term.id),
        );
      }),

      sectionsForActiveGroup: computed((): T.CourseSection[] => {
        if (!state.activeGroupId) {
          return [];
        }

        return stores.courseSectionStore.getSectionsForGroup(
          state.activeGroupId,
        );
      }),

      coursesForActiveGroup: computed((): T.Course[] => {
        if (!state.activeGroupId) {
          return [];
        }

        return getters.sectionsForActiveGroup.value
          .map((section) => stores.courseStore.getCourse(section.courseId))
          .filter(Boolean) as T.Course[];
      }),

      sectionsWithinVisibleTerms: computed((): T.CourseSection[] => {
        return getters.sectionsForActiveGroup.value.filter((section) =>
          methods.isTermVisible(section.termId),
        );
      }),

      coursesWithinVisibleTerms: computed((): T.Course[] => {
        return getters.sectionsWithinVisibleTerms.value
          .map((section) => stores.courseStore.getCourse(section.courseId))
          .filter(Boolean) as T.Course[];
      }),

      enrollmentsInVisibleTerms: computed((): T.Enrollment[] => {
        if (!state.activeGroupId) {
          return [];
        }

        return getters.sectionsWithinVisibleTerms.value
          .flatMap((section) => section.enrollments)
          .filter(Boolean) as T.Enrollment[];
      }),
      peopleInActiveGroup: computed((): T.Person[] => {
        if (!state.activeGroupId) {
          return [];
        }

        return stores.personStore.getPeopleInGroup(state.activeGroupId);
      }),

      peopleInVisibleTerms: computed((): T.Person[] => {
        if (!state.activeGroupId) {
          return [];
        }

        const emplIds: T.Person["emplid"][] =
          getters.enrollmentsInVisibleTerms.value.map(
            (enrollment: T.Enrollment) => enrollment.emplId,
          );
        return uniq(emplIds)
          .map((emplId) => stores.personStore.getPersonByEmplId(emplId))
          .filter(Boolean) as T.Person[];
      }),

      peopleWithIncludedRolesInVisibleTerms: computed((): T.Person[] => {
        if (!state.activeGroupId) {
          return [];
        }

        const people = getters.peopleInVisibleTerms.value;
        return people.filter(methods.isPersonEnrolledWithVisibleRole);
      }),

      acadApptCountsForVisibleTerms: computed(
        (): Record<T.Person["academicAppointment"], number> => {
          if (!state.activeGroupId) {
            return {};
          }

          const people = getters.peopleWithIncludedRolesInVisibleTerms.value;
          const acadApptCount = people.reduce(
            (acc, person) => {
              const acadAppt = person.academicAppointment;
              const previousCount = acc[acadAppt] ?? 0;
              return {
                ...acc,
                [acadAppt]: previousCount + 1,
              };
            },
            {} as Record<T.Person["academicAppointment"], number>,
          );

          return acadApptCount;
        },
      ),
      courseTypeCountsForVisibleTerms: computed(
        (): Record<T.Course["courseType"], number> => {
          if (!state.activeGroupId) {
            return {};
          }

          const courses = getters.coursesWithinVisibleTerms.value;
          return courses.reduce(
            (acc, course) => {
              const courseType = course.courseType;
              const previousCount = acc[courseType] ?? 0;
              return {
                ...acc,
                [courseType]: previousCount + 1,
              };
            },
            {} as Record<T.Course["courseType"], number>,
          );
        },
      ),
      courseLevelCounts: computed(
        (): Record<T.Course["courseLevel"], number> => {
          if (!state.activeGroupId) {
            return {};
          }

          const courses = getters.coursesWithinVisibleTerms.value;
          return courses.reduce(
            (acc, course) => {
              const courseLevel = course.courseLevel;
              const previousCount = acc[courseLevel] ?? 0;
              return {
                ...acc,
                [courseLevel]: previousCount + 1,
              };
            },
            {} as Record<T.Course["courseLevel"], number>,
          );
        },
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
          getters.courseTypeCountsForVisibleTerms.value;
        return Object.entries(courseTypeCounts).sort((a, b) => {
          return a[0].localeCompare(b[0]);
        });
      }),

      sortedAcadAppts: computed(
        (): [T.Person["academicAppointment"], number][] => {
          const acadApptCounts: Record<
            T.Person["academicAppointment"],
            number
          > = getters.acadApptCountsForVisibleTerms.value;
          return Object.entries(acadApptCounts).sort((a, b) => {
            return a[0].localeCompare(b[0]);
          });
        },
      ),
      allAcadApptTypes: computed((): T.Person["academicAppointment"][] =>
        Object.keys(getters.acadApptCountsForVisibleTerms.value),
      ),
      allCourseTypes: computed((): T.Course["courseType"][] =>
        Object.keys(getters.courseTypeCountsForVisibleTerms.value),
      ),
      allCourseLevels: computed((): T.Course["courseLevel"][] =>
        Object.keys(getters.courseLevelCounts.value),
      ),
      canTermBePlannedLookup: computed(
        (): Record<T.Term["id"], boolean> =>
          getters.terms.value.reduce(
            (acc, term) => ({
              ...acc,
              [term.id]: methods.canTermBePlanned(term.id),
            }),
            {} as Record<T.Term["id"], boolean>,
          ),
      ),
      scheduleableTerms: computed((): T.Term[] => {
        return getters.terms.value.filter((term) =>
          methods.canTermBePlanned(term.id),
        );
      }),

      // for colspan
      countOfTermsDisabledForPlanning: computed((): number => {
        return getters.visibleTerms.value.reduce((acc, term) => {
          return methods.canTermBePlanned(term.id) ? acc : acc + 1;
        }, 0);
      }),

      isPersonVisibleLookup: computed(() => {
        if (!state.activeGroupId) {
          throw new Error("active group id is not set");
        }

        const isPersonVisibleLookupByEmplId: Record<
          T.Person["emplid"],
          boolean
        > = {};
        getters.peopleInActiveGroup.value.forEach((person) => {
          const hasVisibleRole =
            methods.isPersonEnrolledWithVisibleRole(person);
          const isAcadApptVisible = !state.filters.excludedAcadAppts.has(
            person.academicAppointment,
          );
          const hasVisibleSection = methods.isPersonEnrolledInVisibleSection(
            person.emplid,
          );

          const isPersonVisible =
            hasVisibleRole &&
            isAcadApptVisible &&
            hasVisibleSection &&
            (methods.isPersonMatchingSearch(person) ||
              methods.isPersonEnrolledInCourseMatchingSearch(person));

          isPersonVisibleLookupByEmplId[person.emplid] = isPersonVisible;
        });

        return isPersonVisibleLookupByEmplId;
      }),

      visiblePeople: computed((): T.Person[] => {
        return getters.peopleInActiveGroup.value.filter(
          (person) => getters.isPersonVisibleLookup.value[person.emplid],
        );
      }),

      leaves: computed((): T.Leave[] => stores.leaveStore.leaves),

      leaveLookupByTermId: computed((): Record<T.Term["id"], T.Leave[]> => {
        if (!state.activeGroupId) return {};
        return stores.leaveStore.getLeaveLookupByTermForGroup(
          state.activeGroupId,
        );
      }),
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
          stores.leaveStore.fetchLeavesForGroup(groupId),
        ]);

        this.setStartTermId(getters.earliestTerm.value?.id ?? null);
        this.setEndTermId(getters.latestTerm.value?.id ?? null);
      },

      setStartTermId(termId: T.Term["id"] | null) {
        state.filters.startTermId = termId;
      },

      setEndTermId(termId: T.Term["id"] | null) {
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

      setIncludedEnrollmentRoles(roles: T.EnrollmentRole[]) {
        state.filters.includedEnrollmentRoles = roles;
      },

      resetFilters() {
        state.filters.excludedAcadAppts = new Set();
        state.filters.excludedCourseLevels = new Set();
        state.filters.excludedCourseTypes = new Set();
        state.filters.startTermId = getters.earliestTerm.value?.id ?? null;
        state.filters.endTermId = getters.latestTerm.value?.id ?? null;

        // don't reset the search
      },
    };

    const methods = {
      getSectionsForEmplId(emplId: T.Person["emplid"]): T.CourseSection[] {
        const enrollmentStore = useEnrollmentStore();
        const enrollments = enrollmentStore.getEnrollmentsForEmplId(emplId);

        const sectionIds = enrollments.map((e) => e.sectionId);

        const sectionStore = useCourseSectionStore();
        return sectionIds
          .map(sectionStore.getSection)
          .filter(Boolean) as T.CourseSection[];
      },

      canTermBePlanned(termId: T.Term["id"]): boolean {
        const termSections =
          stores.courseSectionStore.getSectionsForTerm(termId);
        if (!termSections) {
          // if no sections found, then the term can be planned
          return true;
        }

        // if there are sections, then make sure none
        // are published
        return !termSections.some((section) => section.isPublished);
      },

      getSectionsForEmplIdInTerm(emplId: T.Person["emplid"], termId: number) {
        const sections = methods.getSectionsForEmplId(emplId);
        return sections.filter((section) => section.termId === termId);
      },

      getEnrollmentsInCourseByTerm(
        courseId: T.Course["id"],
      ): Record<T.Term["id"], T.Enrollment[]> {
        const sections =
          stores.courseSectionStore.getSectionsForCourse(courseId);

        const enrollmentsByTerm: Record<T.Term["id"], T.Enrollment[]> = {};

        sections.forEach((section) => {
          enrollmentsByTerm[section.termId] = [
            ...(enrollmentsByTerm[section.termId] ?? []),
            ...section.enrollments,
          ];
        });

        return enrollmentsByTerm;
      },

      getPeopleInGroup: stores.personStore.getPeopleInGroup,

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
          .map((id) => stores.courseSectionStore.getSection(id))
          .filter(Boolean) as T.CourseSection[];

        const visibleSections = sections.filter(methods.isSectionVisible);
        return visibleSections.length > 0;
      },
      isPersonEnrolledWithVisibleRole(person: T.Person) {
        if (!state.activeGroupId) {
          return false;
        }
        const personEnrollments =
          stores.enrollmentStore.getEnrollmentsForEmplIdInGroup(
            person.emplid,
            state.activeGroupId,
          );

        return personEnrollments.some((enrollment) => {
          return state.filters.includedEnrollmentRoles.includes(
            enrollment.role,
          );
        });
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

      isCourseMatchingSearch(course: T.Course) {
        if (!course) {
          return false;
        }

        const courseCode = `${course.subject} ${course.catalogNumber}`;

        return (
          state.filters.search === "" ||
          courseCode.toLowerCase().includes(state.filters.search.toLowerCase())
        );
      },

      isSectionMatchingSearch(section: T.CourseSection) {
        const course = stores.courseStore.getCourse(section.courseId);
        if (!course) return false;
        return methods.isCourseMatchingSearch(course);
      },

      isTermVisible(termId: T.Term["id"]) {
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

      isCourseVisible(course: T.Course) {
        const isCourseTypeVisible = !state.filters.excludedCourseTypes.has(
          course.courseType,
        );
        const isCourseLevelVisible = !state.filters.excludedCourseLevels.has(
          course.courseLevel,
        );

        const sections = stores.courseSectionStore.getSectionsForCourse(
          course.id,
        );

        const hasEnrollmentsThatAreVisible = sections.some((section) =>
          section.enrollments.some(methods.isEnrollmentVisible),
        );

        return (
          isCourseTypeVisible &&
          isCourseLevelVisible &&
          hasEnrollmentsThatAreVisible &&
          methods.isCourseMatchingSearch(course)
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

      isEnrollmentVisible(enrollment: T.Enrollment) {
        const person = stores.personStore.getPersonByEmplId(enrollment.emplId);
        const section = stores.courseSectionStore.getSection(
          enrollment.sectionId,
        );

        return (
          person &&
          section &&
          methods.isPersonVisible(person) &&
          methods.isSectionVisible(section)
        );
      },
      getPeopleInCourseByTerm(
        courseId: T.Course["id"],
      ): Record<T.Term["id"], T.Person[]> {
        const sections =
          stores.courseSectionStore.getSectionsForCourse(courseId);

        const peopleByTerm: Record<T.Term["id"], T.Person[]> = sections.reduce(
          (acc, section) => {
            const enrollments = stores.enrollmentStore.getEnrollmentsForSection(
              section.id,
            );

            const people = enrollments.map((enrollment) =>
              stores.personStore.getPersonByEmplId(enrollment.emplId),
            );

            const termId = section.termId;

            return {
              ...acc,
              [termId]: people.filter(Boolean) as T.Person[],
            };
          },
          {} as Record<T.Term["id"], T.Person[]>,
        );

        return peopleByTerm;
      },
      isPersonVisible(person: T.Person) {
        return getters.isPersonVisibleLookup.value[person.emplid] ?? false;
      },
      isPersonVisibleById(userId: T.Person["id"]) {
        const person = stores.personStore.getPersonByUserId(userId);
        if (!person) {
          return false;
        }

        return methods.isPersonVisible(person);
      },
      isCurrentTerm: stores.termsStore.isCurrentTerm,
      getGroup: stores.groupStore.getGroup,
      getLeavesForPersonInTerm: stores.leaveStore.getLeavesForPersonInTerm,
      getLeavesForPerson: stores.leaveStore.getLeavesForPerson,
      getLeavesInTerm: (termId: T.Term["id"]) => {
        if (!state.activeGroupId) {
          return [];
        }

        return getters.leaveLookupByTermId.value[termId] ?? [];
      },
      getPersonByUserId: stores.personStore.getPersonByUserId,
      getPersonByEmplId: stores.personStore.getPersonByEmplId,
      getSection: stores.courseSectionStore.getSection,
      getSectionsForCourse: stores.courseSectionStore.getSectionsForCourse,
      getLeaveLookupByTermForGroup:
        stores.leaveStore.getLeaveLookupByTermForGroup,
      getCourses: () =>
        stores.courseStore.getCoursesForGroup(state.activeGroupId ?? 0),
      getCourse: stores.courseStore.getCourse,
    };

    return {
      ...toRefs(state),
      ...getters,
      ...actions,
      ...methods,
    };
  },
);
