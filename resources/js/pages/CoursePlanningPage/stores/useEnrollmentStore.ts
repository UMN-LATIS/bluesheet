import { defineStore } from "pinia";
import { reactive, toRefs, computed } from "vue";
import * as api from "@/api";
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
            const emplId = enrollment.emplid;
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
    getEnrollmentsForGroup: computed(
      () =>
        (groupId: number): T.Enrollment[] => {
          const enrollmentIds = state.enrollmentIdsByGroup[groupId] || [];
          return enrollmentIds
            .map((id) => state.enrollmentLookup[id])
            .filter(Boolean) as T.Enrollment[];
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
    addEnrollmentToGroup(
      enrollment: T.Enrollment,
      groupId: T.Group["id"],
    ): void {
      state.enrollmentLookup[enrollment.id] = enrollment;
      state.enrollmentIdsByGroup[groupId] = [
        ...(state.enrollmentIdsByGroup[groupId] ?? []),
        enrollment.id,
      ];
    },
    async createEnrollment({
      person,
      section,
      role,
      groupId,
    }: {
      person: T.Person;
      section: T.CourseSection;
      role: T.EnrollmentRole;
      groupId: T.Group["id"];
    }): Promise<T.Enrollment> {
      const enrollment = await api.createEnrollmentInGroup({
        person,
        section,
        role,
        groupId,
      });

      // update enrollment lookup
      state.enrollmentLookup[enrollment.id] = enrollment;

      // update enrollmentIdsByGroup list
      state.enrollmentIdsByGroup[groupId] = [
        ...(state.enrollmentIdsByGroup[groupId] ?? []),
        enrollment.id,
      ];

      return enrollment;
    },
    removeEnrollmentFromStore(
      enrollment: T.Enrollment,
      groupId: T.Group["id"],
    ): void {
      // remove from enrollmentIdsByGroup
      const enrollmentIds = state.enrollmentIdsByGroup[groupId] || [];

      state.enrollmentIdsByGroup[groupId] = enrollmentIds.filter(
        (id) => id !== enrollment.id,
      );

      // remove from enrollmentLookup
      delete state.enrollmentLookup[enrollment.id];
    },

    async removeEnrollmentFromGroup({
      enrollment,
      groupId,
    }: {
      enrollment: T.Enrollment;
      groupId: T.Group["id"];
    }): Promise<void> {
      // remove from db
      await api.deleteEnrollmentFromGroup(enrollment, groupId);
      actions.removeEnrollmentFromStore(enrollment, groupId);
    },
    bulkRemoveEnrollmentsFromGroup(
      enrollmentIds: T.Enrollment["id"][],
      groupId: T.Group["id"],
    ): void {
      // bulk remove from enrollmentIdsByGroup
      const currentIdsInGroup = state.enrollmentIdsByGroup[groupId] || [];
      const newGroupEnrollmentIds = currentIdsInGroup.filter(
        (id) => !enrollmentIds.includes(id),
      );

      state.enrollmentIdsByGroup[groupId] = newGroupEnrollmentIds;

      // bulk remove from enrollmentLookup
      enrollmentIds.forEach((id) => {
        delete state.enrollmentLookup[id];
      });
    },

    removeAllEnrollmentsForSectionFromStore(
      sectionId: T.CourseSection["id"],
      groupId: T.Group["id"],
    ): void {
      const enrollments = getters.enrollmentsBySectionId.value[sectionId] || [];

      const idsToRemove = enrollments.map((e) => e.id);
      actions.bulkRemoveEnrollmentsFromGroup(idsToRemove, groupId);
    },
  };

  const methods = {
    getEnrollment(id: T.Enrollment["id"]) {
      return state.enrollmentLookup[id] ?? null;
    },
    getEnrollmentsForEmplId(emplId: T.Enrollment["emplid"]): T.Enrollment[] {
      return getters.enrollmentsByEmplId.value[emplId] || [];
    },
    getEnrollmentsForEmplIdInGroup(
      emplid: T.Enrollment["emplid"],
      groupId: T.Group["id"],
    ): T.Enrollment[] {
      const groupEnrollments = getters.getEnrollmentsForGroup.value(groupId);
      return groupEnrollments.filter((e) => e.emplid === emplid);
    },
    getEnrollmentsForSection(sectionId: T.CourseSection["id"]): T.Enrollment[] {
      return getters.enrollmentsBySectionId.value[sectionId] || [];
    },
    getEnrollmentForPersonInSection(
      person: T.Person,
      section: T.CourseSection,
    ): T.Enrollment | null {
      const enrollments = methods.getEnrollmentsForSection(section.id);
      return enrollments.find((e) => e.emplid === person.emplid) ?? null;
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
