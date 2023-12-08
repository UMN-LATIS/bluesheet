import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as api from "../coursePlanningApi";
import { countBy } from "lodash";
import * as T from "@/types";

interface CourseStoreState {
  courseLookup: Record<T.Course["id"], T.Course | undefined>;
  courseIdsByGroup: Record<number, T.Course["id"][] | undefined>;
}

export const useCourseStore = defineStore("course", () => {
  const state = reactive<CourseStoreState>({
    courseLookup: {},
    courseIdsByGroup: {},
  });

  const getters = {
    allCourses: computed(
      (): T.Course[] =>
        Object.values(state.courseLookup).filter(Boolean) as T.Course[],
    ),
    coursesByGroup: computed((): Record<T.Group["id"], T.Course[]> => {
      return Object.entries(state.courseIdsByGroup).reduce<
        Record<number, T.Course[]>
      >((acc, [groupId, courseIds]) => {
        if (!courseIds) {
          return acc;
        }

        const courses = courseIds.map(
          (courseId) => state.courseLookup[courseId],
        );

        return {
          ...acc,
          [groupId]: courses.filter(Boolean) as T.Course[],
        };
      }, {});
    }),
  };

  const actions = {
    async fetchCoursesForGroup(groupId: number): Promise<void> {
      const courses = await api.fetchCoursesForGroup(groupId);

      // update the course lookup in one fell swoop
      const updatedCourseLookup = {
        ...state.courseLookup,
        ...Object.fromEntries(courses.map((course) => [course.id, course])),
      };

      state.courseLookup = updatedCourseLookup;

      // update courseIdsByGroup list
      state.courseIdsByGroup[groupId] = courses.map((course) => course.id);
    },

    getCourse(id: T.Course["id"]): T.Course | undefined {
      return state.courseLookup[id];
    },

    getCoursesForGroup(groupId: number): T.Course[] {
      return getters.coursesByGroup.value[groupId] || [];
    },

    getCourseTypeCountsForGroup(
      groupId: number,
    ): Record<T.Course["courseType"], number> {
      const courses = actions.getCoursesForGroup(groupId);
      const courseTypes = courses.map((c) => c.courseType);
      return countBy(courseTypes);
    },

    getCourseLevelCountsForGroup(
      groupId: number,
    ): Record<T.Course["courseLevel"], number> {
      const courses = actions.getCoursesForGroup(groupId);
      const courseLevels = courses.map((c) => c.courseLevel);
      return countBy(courseLevels);
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
