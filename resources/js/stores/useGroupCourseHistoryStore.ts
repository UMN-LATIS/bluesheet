import { defineStore, storeToRefs } from "pinia";
import * as api from "@/api";
import type {
  Course,
  Group,
  Instructor,
  Term,
  CourseShortCode,
  LoadState,
  TimelessCourse,
  Leave,
  ISODate,
} from "@/types";
import pMap from "p-map";
import { uniqBy } from "lodash-es";
import { ref, computed, watch } from "vue";
import { useTermsStore } from "./useTermsStore";
import { sortByName, dayjs } from "@/utils";

export type CoursesByInstructorAndTermKey = `${Instructor["id"]}-${Term["id"]}`;
export type InstructorsByCourseAndTermKey = `${CourseShortCode}-${Term["id"]}`;

export type CoursesByInstructorTermMap = Map<
  CoursesByInstructorAndTermKey,
  Course[]
>;
export type InstructorsByCourseTermMap = Map<
  InstructorsByCourseAndTermKey,
  InstructorWithCourse[]
>;

export type InstructorWithCourse = Instructor & { course: Course };

function toTimelessCourse(course: Course): TimelessCourse {
  return {
    shortCode: `${course.subject}-${course.catalogNumber}`,
    subject: course.subject,
    catalogNumber: course.catalogNumber,
    title: course.title,
    courseType: course.courseType,
    courseLevel: course.courseLevel,
  };
}

/**
 * for a given term, get the list of leaves for the instructor
 */
function selectInstructorTermLeaves(
  instructor: Instructor,
  term: Term,
): Leave[] {
  return (
    instructor.leaves?.filter((leave) => {
      const leaveStart = dayjs(leave.start_date);
      const leaveEnd = dayjs(leave.end_date);
      const termStart = dayjs(term.startDate);
      const termEnd = dayjs(term.endDate);

      return (
        termStart.isBetween(leaveStart, leaveEnd, "day", "[]") ||
        termEnd.isBetween(leaveStart, leaveEnd, "day", "[]")
      );
    }) ?? []
  );
}

async function fetchCoursesAndInstructorsForTerm(
  groupId: Group["id"],
  termId: Term["id"],
) {
  const instructorsByCourseAndTermMap: InstructorsByCourseTermMap = new Map();
  const coursesByInstructorAndTermMap: CoursesByInstructorTermMap = new Map();

  const courses = await api.getGroupCoursesByTerm({
    groupId,
    termId,
    roles: ["PI", "TA"],
  });

  courses.forEach((course) => {
    const courseAndTermKey: InstructorsByCourseAndTermKey = `${course.shortCode}-${termId}`;
    const existingInstructors =
      instructorsByCourseAndTermMap.get(courseAndTermKey) ?? [];

    // tuck the course into the instructor object so that we can use
    // specific course info like enrollment or class number
    const instructorsWithCourse = course.instructors.map((instructor) => {
      return {
        ...instructor,
        course,
      };
    });

    instructorsByCourseAndTermMap.set(courseAndTermKey, [
      ...existingInstructors,
      ...instructorsWithCourse,
    ]);
    course.instructors.forEach((instructor) => {
      const instructorAndTermKey: CoursesByInstructorAndTermKey = `${instructor.id}-${termId}`;
      const existingCourses =
        coursesByInstructorAndTermMap.get(instructorAndTermKey) ?? [];
      coursesByInstructorAndTermMap.set(instructorAndTermKey, [
        ...existingCourses,
        course,
      ]);
    });
  });

  return { coursesByInstructorAndTermMap, instructorsByCourseAndTermMap };
}

function selectTermsWithinRangeInclusive(
  startDate: ISODate,
  endDate: ISODate,
  terms: Term[],
) {
  return terms.filter((term) => {
    const termStart = dayjs(term.startDate);
    const termEnd = dayjs(term.endDate);
    return (
      termStart.isSameOrAfter(startDate) && termEnd.isSameOrBefore(endDate)
    );
  });
}

const DEFAULT_START_DATE = dayjs().subtract(3, "year").format("YYYY-MM-DD");
const DEFAULT_END_DATE = dayjs().add(2, "year").format("YYYY-MM-DD");
const useStore = defineStore("groupCourseHistory", () => {
  const state = {
    groupId: ref<Group["id"] | null>(null),
    instructorsByCourseTermMap: ref<InstructorsByCourseTermMap>(new Map()),
    coursesByInstructorTermMap: ref<CoursesByInstructorTermMap>(new Map()),
    termLoadStateMap: ref<Map<Term["id"], LoadState>>(new Map()),
    startTermId: ref<Term["id"] | null>(null),
    endTermId: ref<Term["id"] | null>(null),
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
      return (
        terms.value.length > 0 &&
        terms.value.every((term) => {
          const loadState = state.termLoadStateMap.value.get(term.id);
          if (!loadState) {
            return false;
          }
          return ["complete", "error"].includes(loadState);
        })
      );
    }),
    allCourses: computed(() => {
      const courses: TimelessCourse[] = [
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
      const map = new Map<Course["courseType"], number>();
      getters.allCourses.value.forEach((course) => {
        const count = map.get(course.courseType) ?? 0;
        map.set(course.courseType, count + 1);
      });
      return map;
    }),

    courseLevelsMap: computed(() => {
      const map = new Map<Course["courseLevel"], number>();
      getters.allCourses.value.forEach((course) => {
        const count = map.get(course.courseLevel) ?? 0;
        map.set(course.courseLevel, count + 1);
      });
      return map;
    }),

    allInstructors: computed(() => {
      console.log("allInstructors computed");
      const instructors = [
        ...state.instructorsByCourseTermMap.value.values(),
      ].flat();
      // remove duplicates
      return uniqBy(instructors, "id").sort(sortByName);
    }),

    instructorLookup: computed(() => {
      const lookup = new Map<Instructor["id"], Instructor>();
      getters.allInstructors.value.forEach((instructor) => {
        lookup.set(instructor.id, instructor);
      });
      return lookup;
    }),

    instructorAppointmentTypesMap: computed(() => {
      const map = new Map<Instructor["academicAppointment"], number>();
      getters.allInstructors.value.forEach((instructor) => {
        const count = map.get(instructor.academicAppointment) ?? 0;
        map.set(instructor.academicAppointment, count + 1);
      });
      return map;
    }),

    termsInRange: computed(() => {
      const allTerms = getters.allTerms;

      console.log("termsInRange computed", {
        allTerms: allTerms.value,
        startTermId: state.startTermId.value,
        endTermId: state.endTermId.value,
      });

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

      function sortByTermDateAsc(a: Term, b: Term) {
        return dayjs(a.startDate).isBefore(dayjs(b.startDate)) ? -1 : 1;
      }

      const termsInRange = selectTermsWithinRangeInclusive(
        startTerm.startDate,
        endTerm.endDate,
        allTerms.value,
      ).sort(sortByTermDateAsc) as Term[];
      console.log({ termsInRange });
      return termsInRange;
    }),
  };

  const actions = {
    async init(groupId: Group["id"]) {
      actions.resetState();

      state.groupId.value = groupId;
      const termsStore = useTermsStore();
      const { terms } = storeToRefs(termsStore);

      watch(terms, () => {
        if (!terms.value.length) return;
        actions.setDefaultStartAndEndTerms(terms.value);
      });

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
    getCoursesForInstructorPerTerm(instructorId: Instructor["id"]) {
      return getters.termsInRange.value.map((term) => {
        const key =
          `${instructorId}-${term.id}` as CoursesByInstructorAndTermKey;
        return (
          state.coursesByInstructorTermMap.value
            .get(key)
            ?.sort((a, b) => a.shortCode.localeCompare(b.shortCode)) ?? []
        );
      });
    },
    getInstructorsForCoursePerTerm(
      courseShortCode: CourseShortCode,
    ): InstructorWithCourse[][] {
      return getters.termsInRange.value.map((term) => {
        const key =
          `${courseShortCode}-${term.id}` as InstructorsByCourseAndTermKey;
        return (
          state.instructorsByCourseTermMap.value.get(key)?.sort(sortByName) ??
          []
        );
      });
    },

    getLeavesForInstructorPerTerm(instructorId: Instructor["id"]) {
      const instructor = getters.instructorLookup.value.get(instructorId);
      if (!instructor) {
        throw new Error(`Cannot find instructor with id: ${instructorId}`);
      }

      return getters.termsInRange.value.map((term) =>
        selectInstructorTermLeaves(instructor, term),
      );
    },
    setDefaultStartAndEndTerms(allTerms: Term[]) {
      if (!allTerms.length) {
        throw new Error("Cannot set default terms without any terms");
      }

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
    setStartTermId(termId: Term["id"]) {
      state.startTermId.value = termId;
    },
    setEndTermId(termId: Term["id"]) {
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
export const useGroupCourseHistoryStore = (groupId: Group["id"]) => {
  const store = useStore();
  if (store.groupId !== groupId) {
    store.init(groupId);
  }

  return store;
};
