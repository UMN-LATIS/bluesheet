import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import { usePersonStore } from "./usePersonStore";
import { useEnrollmentStore } from "./useEnrollmentStore";
import { useCourseSectionStore } from "./useCourseSectionStore";
import { useCourseStore } from "./useCourseStore";
import { useGroupStore } from "@/stores/useGroupStore";
import { useTermStore } from "@/stores/useTermStore";
import { useLeaveStore } from "./useLeaveStore";
import { countBy, debounce, uniq } from "lodash";
import * as T from "@/types";
import { getCourseTableRows } from "../helpers/getCourseTableRows";
import { getPersonTableRows } from "../helpers/getPersonTableRows";
import { toCourseSpreadsheetRowRecord } from "../helpers/toCourseSpreadsheetRowRecord";
import { toPersonSpreadsheetRowRecord } from "../helpers/toPersonSpreadsheetRowRecord";
import { getTermsWithLeaves } from "../helpers/getTermsWithLeaves";

interface CoursePlanningStoreState {
  activeGroupId: T.Group["id"] | null;
  filters: T.CoursePlanningFilters;
}

export const useCoursePlanningStore = defineStore("coursePlanning", () => {
  const stores = {
    personStore: usePersonStore(),
    enrollmentStore: useEnrollmentStore(),
    courseStore: useCourseStore(),
    groupStore: useGroupStore(),
    termsStore: useTermStore(),
    courseSectionStore: useCourseSectionStore(),
    leaveStore: useLeaveStore(),
  };

  const state = reactive<CoursePlanningStoreState>({
    activeGroupId: null,
    filters: {
      inPlanningMode: false,
      startTermId: null,
      endTermId: null,
      excludedCourseTypes: new Set(),
      excludedCourseLevels: new Set(),
      excludedAcadAppts: new Set(),
      includedEnrollmentRoles: new Set(["PI"]),
      search: "",
    },
  });

  const getters = {
    visibleTerms: computed((): T.Term[] => {
      const sortedTerms = stores.termsStore.sortedTerms;
      let startTermIndex = sortedTerms.findIndex((term) => {
        return term.id === state.filters.startTermId;
      });

      if (startTermIndex === -1) {
        startTermIndex = 0;
      }

      let endTermIndex = stores.termsStore.sortedTerms.findIndex((term) => {
        return term.id === state.filters.endTermId;
      });

      if (endTermIndex === -1) {
        endTermIndex = sortedTerms.length - 1;
      }

      return sortedTerms.slice(startTermIndex, endTermIndex + 1);
    }),
    sectionsWithinVisibleTerms: computed((): T.CourseSection[] => {
      return stores.courseSectionStore.allSections.filter((section) =>
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
        .flatMap((section) =>
          stores.enrollmentStore.getEnrollmentsBySectionId(section.id),
        )
        .filter(Boolean) as T.Enrollment[];
    }),

    peopleInVisibleTerms: computed((): T.Person[] => {
      if (!state.activeGroupId) {
        return [];
      }

      const emplIds: T.Person["emplid"][] =
        getters.enrollmentsInVisibleTerms.value.map(
          (enrollment: T.Enrollment) => enrollment.emplid,
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

        const counts = countBy(
          getters.peopleWithIncludedRolesInVisibleTerms.value,
          "academicAppointment",
        );

        return counts;
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
    courseLevelCounts: computed((): Record<T.Course["courseLevel"], number> => {
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
    }),

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
        const acadApptCounts: Record<T.Person["academicAppointment"], number> =
          getters.acadApptCountsForVisibleTerms.value;
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
    isPersonVisible: computed(() => {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }

      const isPersonVisibleLookupByEmplId: Record<T.Person["emplid"], boolean> =
        {};

      const people = stores.personStore.allPeople;

      people.forEach((person) => {
        const hasVisibleRole = methods.isPersonEnrolledWithVisibleRole(person);

        const isAcadApptVisible = !(
          state.filters.excludedAcadAppts?.has(person.academicAppointment) ??
          false
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

      return (emplId: T.Person["emplid"]) =>
        isPersonVisibleLookupByEmplId[emplId] ?? false;
    }),

    visiblePeople: computed((): T.Person[] => {
      return stores.personStore.allPeople.filter((person) =>
        getters.isPersonVisible.value(person.emplid),
      );
    }),
    coursePlanningLookups: computed(
      (): T.CoursePlanningLookups => ({
        courseLookup: stores.courseStore.courseLookup,
        termLookup: stores.termsStore.termLookup,
        leaveLookup: stores.leaveStore.leaveLookup,
        sectionLookup: stores.courseSectionStore.sectionLookup,
        enrollmentLookup: stores.enrollmentStore.enrollmentLookup,
        personLookup: stores.personStore.personLookupByEmpId,
      }),
    ),
    courseTableRows: computed((): T.CourseTableRow[] => {
      if (!state.activeGroupId) {
        return [];
      }

      return getCourseTableRows({
        lookups: getters.coursePlanningLookups.value,
      });
    }),

    personTableRows: computed((): T.PersonTableRow[] => {
      if (!state.activeGroupId) {
        return [];
      }

      return getPersonTableRows({
        lookups: getters.coursePlanningLookups.value,
        filters: state.filters,
      });
    }),
    instructorTableRows: computed((): T.PersonTableRow[] => {
      if (!state.activeGroupId) {
        return [];
      }

      const lookups = {};

      return getPersonTableRows({
        lookups: getters.coursePlanningLookups.value,
        filters: {
          ...state.filters,
          includedEnrollmentRoles: new Set(["PI"]),
        },
      });
    }),
    taTableRows: computed((): T.PersonTableRow[] => {
      if (!state.activeGroupId) {
        return [];
      }

      return getPersonTableRows({
        lookups: getters.coursePlanningLookups.value,
        filters: {
          ...state.filters,
          includedEnrollmentRoles: new Set(["TA"]),
        },
      });
    }),
    instructorSpreadsheetRows: computed((): T.PersonSpreadsheetRowRecord[] => {
      if (!state.activeGroupId) {
        return [];
      }

      return getters.instructorTableRows.value.map(
        toPersonSpreadsheetRowRecord,
      );
    }),

    taSpreadsheetRows: computed((): T.PersonSpreadsheetRowRecord[] => {
      if (!state.activeGroupId) {
        return [];
      }

      return getters.taTableRows.value.map(toPersonSpreadsheetRowRecord);
    }),

    courseSpreadsheetRows: computed((): T.CourseSpreadsheetRowRecord[] => {
      if (!state.activeGroupId) {
        return [];
      }

      const termLeaves = getTermsWithLeaves({
        lookups: getters.coursePlanningLookups.value,
        filters: state.filters,
      });

      const leavesRecord: T.CourseSpreadsheetRowRecord = {
        id: "leaves",
        title: "Leaves",
        courseLevel: "",
        courseType: "",
        ...termLeaves.reduce((acc, { term, leaves }) => {
          return {
            ...acc,
            [term.name]: leaves.map((leave) => leave.type).join(", "),
          };
        }, {}),
      };

      const courseRecords: T.CourseSpreadsheetRowRecord[] =
        getters.courseTableRows.value.map(toCourseSpreadsheetRowRecord);

      return [leavesRecord, ...courseRecords];
    }),
  };

  const actions = {
    async initGroup(groupId: number) {
      state.activeGroupId = groupId;
      await Promise.all([
        stores.termsStore.init(),
        stores.groupStore.fetchGroup(groupId),
        stores.personStore.init(groupId),
        stores.enrollmentStore.init(groupId),
        stores.courseStore.init(groupId),
        stores.courseSectionStore.init(groupId),
        stores.leaveStore.init(groupId),
      ]);

      const earliestTerm = stores.termsStore.earliestTerm;
      const latestTerm = stores.termsStore.latestTerm;

      this.setStartTermId(earliestTerm?.id ?? null);
      this.setEndTermId(latestTerm?.id ?? null);
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
        (acadAppt) => state.filters.excludedAcadAppts?.has(acadAppt) ?? false,
      );

      if (areAllExcluded) {
        state.filters.excludedAcadAppts = new Set();
        return;
      }

      state.filters.excludedAcadAppts = new Set(getters.allAcadApptTypes.value);
    },

    toggleAllCourseTypes() {
      const areAllExcluded = getters.allCourseTypes.value.every((courseType) =>
        state.filters.excludedCourseTypes.has(courseType),
      );

      if (areAllExcluded) {
        state.filters.excludedCourseTypes = new Set();
        return;
      }

      state.filters.excludedCourseTypes = new Set(getters.allCourseTypes.value);
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
      state.filters.includedEnrollmentRoles = new Set(roles);
    },

    resetFilters() {
      state.filters.excludedAcadAppts = new Set();
      state.filters.excludedCourseLevels = new Set();
      state.filters.excludedCourseTypes = new Set();

      const earliestTerm = stores.termsStore.earliestTerm;
      const latestTerm = stores.termsStore.latestTerm;

      state.filters.startTermId = earliestTerm?.id ?? null;
      state.filters.endTermId = latestTerm?.id ?? null;

      // don't reset the search
    },

    async createSectionWithEnrollee({
      course,
      term,
      person,
      role,
    }: {
      course: T.Course;
      term: T.Term;
      person: T.Person;
      role: T.EnrollmentRole;
    }) {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }
      const section = await stores.courseSectionStore.createSection({
        course,
        term,
      });

      const enrollment = await stores.enrollmentStore.createEnrollment({
        person,
        section,
        role,
      });

      return { section, enrollment };
    },

    async removeSection(section: T.CourseSection) {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }

      // locally remove enrollments from the store
      // no need to use api, since it should cascade delete
      // when the section is deleted
      stores.enrollmentStore.removeAllSectionEnrollmentFromStore(section.id);

      await stores.courseSectionStore.removeSection(section);
    },
  };

  const methods = {
    getSectionsForEmplIdInTerm(emplId: T.Person["emplid"], termId: number) {
      const sections = stores.courseSectionStore.getSectionsByEmplId(emplId);
      return sections.filter((section) => section.termId === termId);
    },

    getEnrollmentsInCourseByTerm(
      courseId: T.Course["id"],
    ): Record<T.Term["id"], T.Enrollment[]> {
      const sections =
        stores.courseSectionStore.getSectionsByCourseId(courseId);

      const enrollmentsByTerm: Record<T.Term["id"], T.Enrollment[]> = {};

      sections.forEach((section) => {
        enrollmentsByTerm[section.termId] = [
          ...(enrollmentsByTerm[section.termId] ?? []),
          ...stores.enrollmentStore.getEnrollmentsBySectionId(section.id),
        ];
      });

      return enrollmentsByTerm;
    },

    isPersonEnrolledInVisibleSection(emplid: T.Person["emplid"]) {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }

      const enrollmentForPersonInGroup =
        stores.enrollmentStore.getEnrollmentsByEmplId(emplid);
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
      const personEnrollments = stores.enrollmentStore.getEnrollmentsByEmplId(
        person.emplid,
      );

      return personEnrollments.some((enrollment) => {
        return state.filters.includedEnrollmentRoles.has(enrollment.role);
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
      const sections = stores.courseSectionStore.getSectionsByEmplId(
        person.emplid,
      );
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
        state.filters.startTermId <= termId && termId <= state.filters.endTermId
      );
    },

    isCourseVisible(course: T.Course) {
      // if we're not in planning mode, and this is a local course, then
      // we should not show it
      if (!state.filters.inPlanningMode && course.source === "local") {
        return false;
      }

      const isCourseTypeVisible = !state.filters.excludedCourseTypes.has(
        course.courseType,
      );
      const isCourseLevelVisible = !state.filters.excludedCourseLevels.has(
        course.courseLevel,
      );

      const sections = stores.courseSectionStore.getSectionsByCourseId(
        course.id,
      );

      const hasEnrollmentsThatAreVisible = sections.some((section) =>
        stores.enrollmentStore
          .getEnrollmentsBySectionId(section.id)
          .some(methods.isEnrollmentVisible),
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
      const person = stores.personStore.getPersonByEmplId(enrollment.emplid);
      const section = stores.courseSectionStore.getSection(
        enrollment.sectionId,
      );

      return (
        person &&
        section &&
        getters.isPersonVisible.value(person.emplid) &&
        methods.isSectionVisible(section)
      );
    },
    getPeopleInCourseByTerm(
      courseId: T.Course["id"],
    ): Record<T.Term["id"], T.Person[]> {
      const sections =
        stores.courseSectionStore.getSectionsByCourseId(courseId);

      const peopleByTerm: Record<T.Term["id"], T.Person[]> = sections.reduce(
        (acc, section) => {
          const enrollments = stores.enrollmentStore.getEnrollmentsBySectionId(
            section.id,
          );

          const people = enrollments.map((enrollment) =>
            stores.personStore.getPersonByEmplId(enrollment.emplid),
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
    isPersonVisibleById(userId: T.Person["id"]) {
      const person = stores.personStore.getPersonByUserId(userId);
      if (!person) {
        return false;
      }

      return getters.isPersonVisible.value(person.emplid);
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
    ...stores,
  };
});
