import { defineStore } from "pinia";
import { reactive, toRefs, computed } from "vue";
import * as api from "@/api";
import * as T from "@/types";
import { groupBy, keyBy } from "lodash";
interface EnrollmentStoreState {
  activeGroupId: T.Group["id"] | null;
  enrollmentLookup: Record<T.Enrollment["id"], T.Enrollment>;
}

export const useEnrollmentStore = defineStore("enrollment", () => {
  const state = reactive<EnrollmentStoreState>({
    activeGroupId: null,
    enrollmentLookup: {},
  });

  const getters = {
    allEnrollments: computed((): T.Enrollment[] => {
      return Object.values(state.enrollmentLookup).filter(
        Boolean,
      ) as T.Enrollment[];
    }),
    getEnrollmentsByEmplId: computed(() => {
      const lookupByEmplid = groupBy<T.Enrollment>(
        getters.allEnrollments.value,
        "emplid",
      );
      return (emplid: T.Person["emplid"]): T.Enrollment[] =>
        lookupByEmplid[emplid] ?? [];
    }),
    getEnrollmentsBySectionId: computed(() => {
      const lookup = groupBy<T.Enrollment>(
        getters.allEnrollments.value,
        "sectionId",
      );

      return (sectionId: T.CourseSection["id"]) => lookup[sectionId] ?? [];
    }),
    getEnrollment: computed(
      () =>
        (id: T.Enrollment["id"]): T.Enrollment | null => {
          return state.enrollmentLookup[id] ?? null;
        },
    ),

    getEnrollmentsByRole: computed(() => {
      const lookup = groupBy<T.Enrollment>(
        getters.allEnrollments.value,
        "role",
      );

      return (role: T.Enrollment["role"]): T.Enrollment[] => lookup[role] ?? [];
    }),

    getEnrollmentForPersonInSection: computed(
      () =>
        (person: T.Person, section: T.CourseSection): T.Enrollment | null => {
          const sectionEnrollments = getters.getEnrollmentsBySectionId.value(
            section.id,
          );
          return (
            sectionEnrollments.find((e) => e.emplid === person.emplid) ?? null
          );
        },
    ),
  };

  const actions = {
    async init(groupId: T.Group["id"]): Promise<void> {
      state.activeGroupId = groupId;
      return actions.fetchEnrollments();
    },
    async fetchEnrollments() {
      if (!state.activeGroupId) {
        throw new Error("activeGroupId is null");
      }
      const enrollments = await api.fetchEnrollmentsForGroup(
        state.activeGroupId,
      );

      state.enrollmentLookup = keyBy<T.Enrollment>(enrollments, "id");
    },
    async createEnrollment({
      person,
      section,
      role,
    }: {
      person: T.Person;
      section: T.CourseSection;
      role: T.EnrollmentRole;
    }): Promise<T.Enrollment> {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }
      const enrollment = await api.createEnrollmentInGroup({
        person,
        section,
        role,
        groupId: state.activeGroupId,
      });

      // update enrollment lookup
      state.enrollmentLookup[enrollment.id] = enrollment;
      return enrollment;
    },
    async removeEnrollment(enrollment: T.Enrollment): Promise<void> {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }
      await api.deleteEnrollmentFromGroup(enrollment, state.activeGroupId);
      delete state.enrollmentLookup[enrollment.id];
    },

    async updateEnrollment(enrollment: T.Enrollment): Promise<void> {
      if (!state.activeGroupId) {
        throw new Error("active group id is not set");
      }

      const updatedEnrollment = await api.updateEnrollmentInGroup(
        enrollment,
        state.activeGroupId,
      );
      delete state.enrollmentLookup[enrollment.id];
      state.enrollmentLookup[updatedEnrollment.id] = updatedEnrollment;
    },

    removeAllSectionEnrollmentFromStore(sectionId: T.CourseSection["id"]) {
      const enrollmentsToRemove =
        getters.getEnrollmentsBySectionId.value(sectionId);

      enrollmentsToRemove.forEach((enrollment) => {
        delete state.enrollmentLookup[enrollment.id];
      });
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
