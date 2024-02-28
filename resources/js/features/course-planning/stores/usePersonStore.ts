import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as api from "@/api";
import * as T from "@/types";
import { countBy, keyBy } from "lodash";
import { useEnrollmentStore } from "./useEnrollmentStore";
import { sortByName } from "@/utils";

interface PersonStoreState {
  activeGroupId: T.Group["id"] | null;
  personLookupByEmpId: Record<T.Person["emplid"], T.Person>;
}

export const usePersonStore = defineStore("person", () => {
  const state = reactive<PersonStoreState>({
    activeGroupId: null,
    personLookupByEmpId: {},
  });

  const getters = {
    allPeople: computed((): T.Person[] => {
      const people = Object.values(state.personLookupByEmpId).filter(
        Boolean,
      ) as T.Person[];
      return people.sort(sortByName);
    }),
    getPersonByEmplId: computed(
      () =>
        (emplId: T.Person["emplid"]): T.Person | null => {
          return state.personLookupByEmpId[emplId] ?? null;
        },
    ),
    getPersonByUserId: computed(() => {
      const lookupByUserId: Record<T.Person["id"], T.Person> = keyBy(
        getters.allPeople.value,
        "id",
      );

      return (userId: T.Person["id"]): T.Person | null =>
        lookupByUserId[userId] ?? null;
    }),
    getPeopleWithRoles: computed(
      () =>
        (roles: T.Enrollment["role"][]): T.Person[] => {
          const enrollmentStore = useEnrollmentStore();

          const enrollmentWithRoles = roles.flatMap((role) =>
            enrollmentStore.getEnrollmentsByRole(role),
          );

          const people = enrollmentWithRoles.map((e) =>
            getters.getPersonByEmplId.value(e.emplid),
          );
          return people.filter(Boolean) as T.Person[];
        },
    ),
    acadApptCounts: computed(
      (): Record<T.Person["academicAppointment"], number> => {
        const acadAppts = getters.allPeople.value.map(
          (p) => p.academicAppointment,
        );
        return countBy(acadAppts);
      },
    ),
  };

  const actions = {
    async init(groupId: T.Group["id"]): Promise<void> {
      state.activeGroupId = groupId;
      return actions.fetchPeopleForGroup(groupId);
    },
    async fetchPeopleForGroup(groupId: number): Promise<void> {
      const persons = await api.fetchPeopleForGroup(groupId);

      // update the person lookup in one fell swoop
      const updatedPersonLookup = {
        ...state.personLookupByEmpId,
        ...Object.fromEntries(persons.map((person) => [person.emplid, person])),
      };

      state.personLookupByEmpId = updatedPersonLookup;
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
