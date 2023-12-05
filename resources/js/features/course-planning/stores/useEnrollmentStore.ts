import { defineStore } from "pinia";
import { reactive, toRefs, computed } from "vue";
import * as api from "../coursePlanningApi";
import * as T from "../coursePlanningTypes";
import { Group } from "@/types";

interface EnrollmentStoreState {
  enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment | undefined>;
  enrollmentIdsByGroup: Record<Group["id"], T.Enrollment["id"][] | undefined>;
}

export const useEnrollmentStore = defineStore("enrollment", () => {
  const state = reactive<EnrollmentStoreState>({
    enrollmentLookup: {},
    enrollmentIdsByGroup: {},
  });

  const getters = {
    allEnrollments: computed(
      () =>
        Object.values(state.enrollmentLookup).filter(Boolean) as T.Enrollment[],
    ),
    enrollmentIdsByPerson: computed(
      (): Record<T.Person["id"], T.Enrollment["id"][]> => {
        return getters.allEnrollments.value.reduce(
          (acc, enrollment) => {
            const personId = enrollment.personId;
            const previousEnrollmentIds = acc[personId] || [];

            return {
              ...acc,
              [personId]: [...previousEnrollmentIds, enrollment.id],
            };
          },
          {} as Record<T.Person["id"], T.Enrollment["id"][]>,
        );
      },
    ),
  };

  const actions = {
    async fetchEnrollmentsForGroup(groupId: number) {
      const enrollments = await api.fetchEnrollmentsForGroup(groupId);

      // update the enrollment lookup in one fell swoop
      const updatedEnrollmentLookup = {
        ...state.enrollmentLookup,
        ...Object.fromEntries(
          enrollments.map((enrollment) => [enrollment.id, enrollment]),
        ),
      };

      state.enrollmentLookup = updatedEnrollmentLookup;

      // update enrollmentIdsByGroup list
      state.enrollmentIdsByGroup[groupId] = enrollments.map(
        (enrollment) => enrollment.id,
      );
    },
  };

  const methods = {
    getEnrollmentsForGroup(groupId: number): T.Enrollment[] {
      const enrollmentIds = state.enrollmentIdsByGroup[groupId] || [];
      return enrollmentIds
        .map((id) => state.enrollmentLookup[id])
        .filter(Boolean) as T.Enrollment[];
    },
    getEnrollmentsForPerson(personId: number): T.Enrollment[] {
      const enrollmentIds = getters.enrollmentIdsByPerson.value[personId] || [];
      return enrollmentIds
        .map((id) => state.enrollmentLookup[id])
        .filter(Boolean) as T.Enrollment[];
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
