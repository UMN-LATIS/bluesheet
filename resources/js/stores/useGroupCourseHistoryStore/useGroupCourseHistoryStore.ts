import { defineStore, storeToRefs } from "pinia";
import type * as T from "@/types";
import pMap from "p-map";
import { uniqBy } from "lodash-es";
import { computed, watch, reactive, toRefs } from "vue";
import { useTermsStore } from "@/stores/useTermsStore";
import { sortByName, dayjs, getTempId } from "@/utils";
import { omit } from "lodash";
import { toTimelessCourse } from "./toTimelessCourse";
import {
  selectInstructorTermLeaves,
  selectTermsWithinRangeInclusive,
} from "./selectors";
import { fetchCoursesAndInstructorsForTerm } from "./fetchCourseAndInstructorsForTerm";
import * as api from "@/api";

export interface GroupCourseHistoryState {
  groupId: T.Group["id"] | null;
  instructorsByCourseTermMap: T.InstructorsByCourseTermMap;
  coursesByInstructorTermMap: T.CoursesByInstructorTermMap;
  termLoadStateMap: Map<T.Term["id"], T.LoadState>;
  startTermId: T.Term["id"] | null;
  endTermId: T.Term["id"] | null;
  isInPlanningMode: boolean;
}

const useStore = defineStore("groupCourseHistory", () => {
  const state = reactive<GroupCourseHistoryState>({
    groupId: null,
    instructorsByCourseTermMap: new Map(),
    coursesByInstructorTermMap: new Map(),
    termLoadStateMap: new Map(),
    startTermId: null,
    endTermId: null,
    isInPlanningMode: false,
  });

  const getters = {
    allTerms: computed(() => {
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);
      return terms.value;
    }),

    currentTerm: computed(() => {
      const termsStore = useTermsStore();
      const { currentTerm } = storeToRefs(termsStore);
      return currentTerm.value;
    }),

    isLoadingComplete: computed(() => {
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);

      if (!terms.value.length) {
        return false;
      }

      // check if all terms in the range have been loaded
      for (const term of getters.termsInRange.value) {
        const loadState = state.termLoadStateMap.get(term.id);
        if (!loadState || ["idle", "loading"].includes(loadState)) {
          return false;
        }
      }
      return true;
    }),
    allCourses: computed((): T.TimelessCourse[] => {
      const courses: T.TimelessCourse[] = [
        ...state.coursesByInstructorTermMap.values(),
      ]
        .flat()
        .map(toTimelessCourse);
      // remove duplicates
      return uniqBy(courses, "shortCode").sort((a, b) => {
        // sort by course code
        return a.shortCode.localeCompare(b.shortCode);
      });
    }),
    courseTypesMap: computed(() => {
      const map = new Map<T.Course["courseType"], number>();
      getters.allCourses.value.forEach((course) => {
        const count = map.get(course.courseType) ?? 0;
        map.set(course.courseType, count + 1);
      });
      return map;
    }),

    courseLevelsMap: computed(() => {
      const map = new Map<T.Course["courseLevel"], number>();
      getters.allCourses.value.forEach((course) => {
        const count = map.get(course.courseLevel) ?? 0;
        map.set(course.courseLevel, count + 1);
      });
      return map;
    }),

    allInstructors: computed((): T.Instructor[] => {
      const instructors = [...state.instructorsByCourseTermMap.values()].flat();
      // remove duplicates
      return uniqBy(instructors, "id").sort(sortByName);
    }),

    instructorLookup: computed((): Map<T.Instructor["id"], T.Instructor> => {
      const lookup = new Map();
      getters.allInstructors.value.forEach((instructor) => {
        lookup.set(instructor.id, instructor);
      });
      return lookup;
    }),

    instructorAppointmentTypesMap: computed(
      (): Map<T.Instructor["academicAppointment"], number> => {
        const map = new Map();
        getters.allInstructors.value.forEach((instructor) => {
          const count = map.get(instructor.academicAppointment) ?? 0;
          map.set(instructor.academicAppointment, count + 1);
        });
        return map;
      },
    ),

    termsInRange: computed((): T.Term[] => {
      const allTerms = getters.allTerms;

      if (!allTerms.value.length) {
        return [];
      }

      if (!state.startTermId || !state.endTermId) {
        return [];
      }
      const startTerm = allTerms.value.find(
        (term) => term.id === state.startTermId,
      );
      const endTerm = allTerms.value.find(
        (term) => term.id === state.endTermId,
      );

      if (!startTerm || !endTerm) {
        console.error("Could not find start or end term for termsInRange", {
          startTerm,
          endTerm,
          startTermId: state.startTermId,
          endTermId: state.endTermId,
          allTerms,
        });
        return [];
      }

      function sortByTermDateAsc(a: T.Term, b: T.Term) {
        return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
      }

      const termsInRange = selectTermsWithinRangeInclusive(
        startTerm.startDate,
        endTerm.endDate,
        allTerms.value,
      ).sort(sortByTermDateAsc) as T.Term[];
      return termsInRange;
    }),

    /**
     * an array of instructor leaves for each term in the range
     */
    leavesPerTerm: computed((): T.LeaveWithInstructor[][] => {
      const termsInRange = getters.termsInRange.value;

      // for each term
      return termsInRange.map((term) => {
        // loop through all instructors and find any relevant leaves
        // flatten the array since we don't want term-instructor-leaves
        // and just term-leaves
        return getters.allInstructors.value.flatMap((instructor) => {
          const instructorLeavesForThisTerm = selectInstructorTermLeaves(
            instructor,
            term,
          );

          // for each leave, tuck the instructor into the
          // leave object so that we can use it in the UI
          return instructorLeavesForThisTerm.map((leave) => {
            return {
              ...leave,
              instructor: omit(instructor, ["leaves"]),
            };
          });
        });
      });
    }),
  };

  const actions = {
    async init(groupId: T.Group["id"]) {
      actions.resetState();

      state.groupId = groupId;
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);

      watch(
        terms,
        () => {
          if (!terms.value.length) return;
          actions.setDefaultStartAndEndTerms(terms.value);
        },
        { immediate: true },
      );

      watch(
        getters.termsInRange,
        () => {
          if (!state.groupId) {
            throw new Error("Cannot initialize without a `groupId`");
          }

          const termsInRange = getters.termsInRange.value;
          if (!termsInRange.length) return;

          termsInRange.forEach((term) => {
            // initialize the load state for terms that haven't already been initialized
            if (state.termLoadStateMap.has(term.id)) return;
            state.termLoadStateMap.set(term.id, "idle");
          });

          pMap(
            termsInRange,
            async (term) => {
              if (!state.groupId) {
                throw new Error("Cannot initialize without a `groupId`");
              }

              const currentTermLoadState = state.termLoadStateMap.get(term.id);

              if (!currentTermLoadState) {
                // this shouldn't happen if we've initialized properly
                throw new Error(`Cannot find load state for term: ${term.id}`);
              }
              // if fetch is already in progress or complete, skip
              if (["loading", "complete"].includes(currentTermLoadState)) {
                return;
              }

              // otherwise, fetch the courses and instructors for the term
              // and update our Maps
              try {
                state.termLoadStateMap.set(term.id, "loading");
                const {
                  coursesByInstructorAndTermMap,
                  instructorsByCourseAndTermMap,
                } = await fetchCoursesAndInstructorsForTerm(
                  state.groupId,
                  term.id,
                );
                // do this as one batch update to avoid
                // triggering multiple re-renders
                state.coursesByInstructorTermMap = new Map([
                  ...state.coursesByInstructorTermMap,
                  ...coursesByInstructorAndTermMap,
                ]);
                state.instructorsByCourseTermMap = new Map([
                  ...state.instructorsByCourseTermMap,
                  ...instructorsByCourseAndTermMap,
                ]);
              } catch (e) {
                state.termLoadStateMap.set(term.id, "error");
              } finally {
                state.termLoadStateMap.set(term.id, "complete");
              }
            },
            { concurrency: 5 },
          );
        },
        { immediate: true },
      );
    },

    getCoursesForInstructorPerTerm(instructorId: T.Instructor["id"]) {
      return getters.termsInRange.value.map((term) => {
        const key =
          `${instructorId}-${term.id}` as T.CoursesByInstructorAndTermKey;
        return (
          state.coursesByInstructorTermMap
            .get(key)
            ?.sort((a, b) => a.shortCode.localeCompare(b.shortCode)) ?? []
        );
      });
    },
    getInstructorsForCoursePerTerm(
      courseShortCode: T.CourseShortCode,
    ): T.InstructorWithCourse[][] {
      return getters.termsInRange.value.map((term) => {
        const key =
          `${courseShortCode}-${term.id}` as T.InstructorsByCourseAndTermKey;
        return (
          state.instructorsByCourseTermMap.get(key)?.sort(sortByName) ?? []
        );
      });
    },

    getLeavesForInstructorPerTerm(instructorId: T.Instructor["id"]) {
      const instructor = getters.instructorLookup.value.get(instructorId);
      if (!instructor) {
        throw new Error(`Cannot find instructor with id: ${instructorId}`);
      }

      return getters.termsInRange.value.map((term) =>
        selectInstructorTermLeaves(instructor, term),
      );
    },
    setDefaultStartAndEndTerms(allTerms: T.Term[]) {
      if (!allTerms.length) {
        throw new Error("Cannot set default terms without any terms");
      }

      const DEFAULT_START_DATE = dayjs()
        .subtract(3, "year")
        .format("YYYY-MM-DD");
      const DEFAULT_END_DATE = dayjs().add(2, "year").format("YYYY-MM-DD");

      const defaultTerms = selectTermsWithinRangeInclusive(
        DEFAULT_START_DATE,
        DEFAULT_END_DATE,
        allTerms,
      );

      if (defaultTerms.length < 2) {
        throw new Error("Could not find default terms");
      }

      state.startTermId = defaultTerms[0].id;
      state.endTermId = defaultTerms[defaultTerms.length - 1].id;
    },
    resetState() {
      state.groupId = null;
      state.instructorsByCourseTermMap.clear();
      state.coursesByInstructorTermMap.clear();
      state.termLoadStateMap.clear();
      state.startTermId = null;
      state.endTermId = null;
    },
    setStartTermId(termId: T.Term["id"]) {
      state.startTermId = termId;
    },
    setEndTermId(termId: T.Term["id"]) {
      state.endTermId = termId;
    },

    addCourseHistory({
      course,
      instructor,
      term,
    }: {
      course: T.Course;
      term: T.Term;
      instructor: T.Instructor;
    }) {
      // update the coursesByInstructorTermMap
      const instructorAndTermKey =
        `${instructor.id}-${term.id}` as T.CoursesByInstructorAndTermKey;
      const existingCourses =
        state.coursesByInstructorTermMap.get(instructorAndTermKey) ?? [];
      state.coursesByInstructorTermMap.set(instructorAndTermKey, [
        ...existingCourses,
        course,
      ]);

      // update the instructorsByCourseTermMap
      const courseAndTermKey =
        `${course.shortCode}-${term.id}` as T.InstructorsByCourseAndTermKey;
      const existingInstructors =
        state.instructorsByCourseTermMap.get(courseAndTermKey) ?? [];

      const instructorWithCourse: T.InstructorWithCourse = {
        ...instructor,
        course,
      };
      state.instructorsByCourseTermMap.set(courseAndTermKey, [
        ...existingInstructors,
        instructorWithCourse,
      ]);
    },

    removeCourseHistory({
      course,
      instructor,
      term,
    }: {
      course: T.Course;
      term: T.Term;
      instructor: T.Instructor;
    }) {
      // update the coursesByInstructorTermMap
      const instructorAndTermKey =
        `${instructor.id}-${term.id}` as T.CoursesByInstructorAndTermKey;
      const existingCourses =
        state.coursesByInstructorTermMap.get(instructorAndTermKey) ?? [];
      const updatedCourses = existingCourses.filter(
        (c) => c.classNumber !== course.classNumber,
      );
      state.coursesByInstructorTermMap.set(
        instructorAndTermKey,
        updatedCourses,
      );

      // update the instructorsByCourseTermMap
      const courseAndTermKey =
        `${course.shortCode}-${term.id}` as T.InstructorsByCourseAndTermKey;
      const existingInstructors =
        state.instructorsByCourseTermMap.get(courseAndTermKey) ?? [];
      const updatedInstructors = existingInstructors.filter(
        (i) => i.id !== instructor.id,
      );
      state.instructorsByCourseTermMap.set(
        courseAndTermKey,
        updatedInstructors,
      );
    },

    async addPlannedCourseToTerm({
      course,
      instructor,
      term,
    }: {
      course: T.TimelessCourse;
      term: T.Term;
      instructor: T.Instructor;
    }) {
      if (!state.groupId) {
        throw new Error("Cannot add tentative course without a `groupId`");
      }

      const plannedCourse: T.Course = {
        ...course,
        classNumber: getTempId(),
        classSection: "TBD",
        term: term.id,
        instructors: [instructor],
        enrollmentCap: 0,
        enrollmentTotal: 0,
        isPlanned: true,
        cancelled: false,
      };

      // optimistic update: add course to store
      actions.addCourseHistory({
        course: plannedCourse,
        instructor,
        term,
      });

      const apiPlannedCourse = {
        term_id: term.id,
        subject: course.subject,
        catalog_number: course.catalogNumber,
        title: course.title,
        course_type: course.courseType,
        course_level: course.courseLevel,
        user_id: instructor.id,
      };

      // make api call to add course
      const savedCourse = await api.postPlannedCourseForGroup({
        course: apiPlannedCourse,
        groupId: state.groupId,
      });

      // update course with response from api
      actions.removeCourseHistory({
        course: plannedCourse,
        instructor,
        term,
      });

      actions.addCourseHistory({
        course: {
          // planned course has some properties that are not
          // present in the api response, so we spread them here
          ...plannedCourse,
          ...savedCourse,
        },
        instructor,
        term,
      });
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});

// this is a convenience function that allows us to
// automatically initialize a store for a given group
export const useGroupCourseHistoryStore = (groupId?: T.Group["id"]) => {
  const store = useStore();
  if (groupId && store.groupId !== groupId) {
    store.init(groupId);
  }

  return store;
};
