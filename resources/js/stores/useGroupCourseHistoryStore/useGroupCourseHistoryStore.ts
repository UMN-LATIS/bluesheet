import { defineStore, storeToRefs } from "pinia";
import type * as Types from "@/types";
import pMap from "p-map";
import { uniqBy } from "lodash-es";
import { ref, computed, watch } from "vue";
import { useTermsStore } from "@/stores/useTermsStore";
import { sortByName, dayjs } from "@/utils";
import { omit } from "lodash";
import { toTimelessCourse } from "./toTimelessCourse";
import {
  selectInstructorTermLeaves,
  selectTermsWithinRangeInclusive,
} from "./selectors";
import { fetchCoursesAndInstructorsForTerm } from "./fetchCourseAndInstructorsForTerm";

const useStore = defineStore("groupCourseHistory", () => {
  const state = {
    groupId: ref<Types.Group["id"] | null>(null),
    instructorsByCourseTermMap: ref<Types.InstructorsByCourseTermMap>(
      new Map(),
    ),
    coursesByInstructorTermMap: ref<Types.CoursesByInstructorTermMap>(
      new Map(),
    ),
    termLoadStateMap: ref<Map<Types.Term["id"], Types.LoadState>>(new Map()),
    startTermId: ref<Types.Term["id"] | null>(null),
    endTermId: ref<Types.Term["id"] | null>(null),
  };

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
        const loadState = state.termLoadStateMap.value.get(term.id);
        if (!loadState || ["idle", "loading"].includes(loadState)) {
          return false;
        }
      }
      return true;
    }),
    allCourses: computed((): Types.TimelessCourse[] => {
      const courses: Types.TimelessCourse[] = [
        ...state.coursesByInstructorTermMap.value.values(),
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
      const map = new Map<Types.Course["courseType"], number>();
      getters.allCourses.value.forEach((course) => {
        const count = map.get(course.courseType) ?? 0;
        map.set(course.courseType, count + 1);
      });
      return map;
    }),

    courseLevelsMap: computed(() => {
      const map = new Map<Types.Course["courseLevel"], number>();
      getters.allCourses.value.forEach((course) => {
        const count = map.get(course.courseLevel) ?? 0;
        map.set(course.courseLevel, count + 1);
      });
      return map;
    }),

    allInstructors: computed((): Types.Instructor[] => {
      const instructors = [
        ...state.instructorsByCourseTermMap.value.values(),
      ].flat();
      // remove duplicates
      return uniqBy(instructors, "id").sort(sortByName);
    }),

    instructorLookup: computed(
      (): Map<Types.Instructor["id"], Types.Instructor> => {
        const lookup = new Map();
        getters.allInstructors.value.forEach((instructor) => {
          lookup.set(instructor.id, instructor);
        });
        return lookup;
      },
    ),

    instructorAppointmentTypesMap: computed(
      (): Map<Types.Instructor["academicAppointment"], number> => {
        const map = new Map();
        getters.allInstructors.value.forEach((instructor) => {
          const count = map.get(instructor.academicAppointment) ?? 0;
          map.set(instructor.academicAppointment, count + 1);
        });
        return map;
      },
    ),

    termsInRange: computed((): Types.Term[] => {
      const allTerms = getters.allTerms;

      if (!allTerms.value.length) {
        return [];
      }

      if (!state.startTermId.value || !state.endTermId.value) {
        return [];
      }
      const startTerm = allTerms.value.find(
        (term) => term.id === state.startTermId.value,
      );
      const endTerm = allTerms.value.find(
        (term) => term.id === state.endTermId.value,
      );

      if (!startTerm || !endTerm) {
        console.error("Could not find start or end term for termsInRange", {
          startTerm,
          endTerm,
          startTermId: state.startTermId.value,
          endTermId: state.endTermId.value,
          allTerms,
        });
        return [];
      }

      function sortByTermDateAsc(a: Types.Term, b: Types.Term) {
        return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
      }

      const termsInRange = selectTermsWithinRangeInclusive(
        startTerm.startDate,
        endTerm.endDate,
        allTerms.value,
      ).sort(sortByTermDateAsc) as Types.Term[];
      return termsInRange;
    }),

    /**
     * an array of instructor leaves for each term in the range
     */
    leavesPerTerm: computed((): Types.LeaveWithInstructor[][] => {
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
    async init(groupId: Types.Group["id"]) {
      actions.resetState();

      state.groupId.value = groupId;
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
          if (!state.groupId.value) {
            throw new Error("Cannot initialize without a `groupId`");
          }

          const termsInRange = getters.termsInRange.value;
          if (!termsInRange.length) return;

          termsInRange.forEach((term) => {
            // initialize the load state for terms that haven't already been initialized
            if (state.termLoadStateMap.value.has(term.id)) return;
            state.termLoadStateMap.value.set(term.id, "idle");
          });

          pMap(
            termsInRange,
            async (term) => {
              if (!state.groupId.value) {
                throw new Error("Cannot initialize without a `groupId`");
              }

              const currentTermLoadState = state.termLoadStateMap.value.get(
                term.id,
              );

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
                state.termLoadStateMap.value.set(term.id, "loading");
                const {
                  coursesByInstructorAndTermMap,
                  instructorsByCourseAndTermMap,
                } = await fetchCoursesAndInstructorsForTerm(
                  state.groupId.value,
                  term.id,
                );
                // do this as one batch update to avoid
                // triggering multiple re-renders
                state.coursesByInstructorTermMap.value = new Map([
                  ...state.coursesByInstructorTermMap.value,
                  ...coursesByInstructorAndTermMap,
                ]);
                state.instructorsByCourseTermMap.value = new Map([
                  ...state.instructorsByCourseTermMap.value,
                  ...instructorsByCourseAndTermMap,
                ]);
              } catch (e) {
                state.termLoadStateMap.value.set(term.id, "error");
              } finally {
                state.termLoadStateMap.value.set(term.id, "complete");
              }
            },
            { concurrency: 5 },
          );
        },
        { immediate: true },
      );
    },

    getCoursesForInstructorPerTerm(instructorId: Types.Instructor["id"]) {
      return getters.termsInRange.value.map((term) => {
        const key =
          `${instructorId}-${term.id}` as Types.CoursesByInstructorAndTermKey;
        return (
          state.coursesByInstructorTermMap.value
            .get(key)
            ?.sort((a, b) => a.shortCode.localeCompare(b.shortCode)) ?? []
        );
      });
    },
    getInstructorsForCoursePerTerm(
      courseShortCode: Types.CourseShortCode,
    ): Types.InstructorWithCourse[][] {
      return getters.termsInRange.value.map((term) => {
        const key =
          `${courseShortCode}-${term.id}` as Types.InstructorsByCourseAndTermKey;
        return (
          state.instructorsByCourseTermMap.value.get(key)?.sort(sortByName) ??
          []
        );
      });
    },

    getLeavesForInstructorPerTerm(instructorId: Types.Instructor["id"]) {
      const instructor = getters.instructorLookup.value.get(instructorId);
      if (!instructor) {
        throw new Error(`Cannot find instructor with id: ${instructorId}`);
      }

      return getters.termsInRange.value.map((term) =>
        selectInstructorTermLeaves(instructor, term),
      );
    },
    setDefaultStartAndEndTerms(allTerms: Types.Term[]) {
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

      state.startTermId.value = defaultTerms[0].id;
      state.endTermId.value = defaultTerms[defaultTerms.length - 1].id;
    },
    resetState() {
      state.groupId.value = null;
      state.instructorsByCourseTermMap.value = new Map();
      state.coursesByInstructorTermMap.value = new Map();
      state.termLoadStateMap.value = new Map();
      state.startTermId.value = null;
      state.endTermId.value = null;
    },
    setStartTermId(termId: Types.Term["id"]) {
      state.startTermId.value = termId;
    },
    setEndTermId(termId: Types.Term["id"]) {
      state.endTermId.value = termId;
    },
  };

  return {
    ...state,
    ...getters,
    ...actions,
  };
});

// this is a convenience function that allows us to
// automatically initialize a store for a given group
export const useGroupCourseHistoryStore = (groupId: Types.Group["id"]) => {
  const store = useStore();
  if (store.groupId !== groupId) {
    store.init(groupId);
  }

  return store;
};
