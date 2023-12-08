import { defineStore } from "pinia";
import { reactive, toRefs, computed } from "vue";
import * as api from "../coursePlanningApi";
import * as T from "@/types";
interface EnrollmentStoreState {
  enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment | undefined>;
  enrollmentIdsByGroup: Record<T.Group["id"], T.Enrollment["id"][] | undefined>;
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
    enrollmentsByEmplId: computed(
      (): Record<T.Person["id"], T.Enrollment[]> => {
        return getters.allEnrollments.value.reduce(
          (acc, enrollment) => {
            const emplId = enrollment.emplId;
            const previousEnrollmentIds = acc[emplId] || [];

            return {
              ...acc,
              [emplId]: [...previousEnrollmentIds, enrollment],
            };
          },
          {} as Record<T.Person["id"], T.Enrollment[]>,
        );
      },
    ),
    enrollmentsBySectionId: computed(
      (): Record<T.CourseSection["id"], T.Enrollment[]> => {
        const enrollmentsBySection: Record<
          T.CourseSection["id"],
          T.Enrollment[]
        > = {};

        getters.allEnrollments.value.forEach((enrollment) => {
          enrollmentsBySection[enrollment.sectionId] = [
            ...(enrollmentsBySection[enrollment.sectionId] ?? []),
            enrollment,
          ];
        });
        return enrollmentsBySection;
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
    getEnrollment(id: T.Enrollment["id"]) {
      return state.enrollmentLookup[id] ?? null;
    },

    getEnrollmentsForGroup(groupId: number): T.Enrollment[] {
      const enrollmentIds = state.enrollmentIdsByGroup[groupId] || [];
      return enrollmentIds
        .map((id) => state.enrollmentLookup[id])
        .filter(Boolean) as T.Enrollment[];
    },
    getEnrollmentsForEmplId(emplId: T.Enrollment["emplId"]): T.Enrollment[] {
      return getters.enrollmentsByEmplId.value[emplId] || [];
    },
    getEnrollmentsForEmplIdInGroup(
      emplid: T.Enrollment["emplId"],
      groupId: T.Group["id"],
    ): T.Enrollment[] {
      const groupEnrollments = methods.getEnrollmentsForGroup(groupId);
      return groupEnrollments.filter((e) => e.emplId === emplid);
    },
    getEnrollmentsForSection(sectionId: T.CourseSection["id"]): T.Enrollment[] {
      return getters.enrollmentsBySectionId.value[sectionId] || [];
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
