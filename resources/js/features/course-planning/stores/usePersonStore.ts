import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as api from "../coursePlanningApi";
import * as T from "../coursePlanningTypes";
import { Group } from "@/types";

interface PersonStoreState {
  personLookupByEmpId: Record<T.Person["emplid"], T.Person | undefined>;
  personIdsByGroup: Record<number, T.Person["id"][] | undefined>;
}

/**
 * a person is a user who is enrolled in a course section
 * TODO: merge with useUserStore
 */
export const usePersonStore = defineStore("person", () => {
  const state = reactive<PersonStoreState>({
    personLookupByEmpId: {},
    personIdsByGroup: {},
  });

  const getters = {
    allPeople: computed(
      (): T.Person[] =>
        Object.values(state.personLookupByEmpId).filter(Boolean) as T.Person[],
    ),
    personLookupByUserId: computed((): Record<T.Person["id"], T.Person> => {
      const lookup: Record<T.Person["id"], T.Person> = {};
      Object.values(state.personLookupByEmpId).forEach((person) => {
        if (!person) return;
        lookup[person.id] = person;
      });
      return lookup;
    }),

    /**
     * counts the number of people with a particular academic
     * appointment for each group
     */
    acadApptCountsByGroup: computed(() => {
      const counts: Record<
        Group["id"],
        Record<T.Person["academicAppointment"], number>
      > = {};

      const groupIds = Object.keys(state.personIdsByGroup).map(Number);

      groupIds.forEach((groupId) => {
        const people = methods.getPeopleInGroup(groupId);

        if (!people) return;

        counts[groupId] = people.reduce(
          (acc, person) => {
            if (!acc[person.academicAppointment]) {
              acc[person.academicAppointment] = 0;
            }

            acc[person.academicAppointment]++;

            return acc;
          },
          {} as Record<T.Person["academicAppointment"], number>,
        );
      });

      return counts;
    }),
  };

  const actions = {
    async fetchPeopleForGroup(groupId: number) {
      const persons = await api.fetchPeopleForGroup(groupId);

      // update the person lookup in one fell swoop
      const updatedPersonLookup = {
        ...state.personLookupByEmpId,
        ...Object.fromEntries(persons.map((person) => [person.emplid, person])),
      };

      state.personLookupByEmpId = updatedPersonLookup;

      // update personIdsByGroup list
      state.personIdsByGroup[groupId] = persons.map((person) => person.emplid);
    },
  };

  const methods = {
    /**
     * get a person by id
     */
    getPersonByEmplId(emplId: T.Person["emplid"]): T.Person | null {
      const person = state.personLookupByEmpId[emplId] ?? null;

      // for debugging
      // if (!person) {
      //   console.warn(`No person found with emplId ${emplId}.`);
      // }
      return person;
    },
    getPeopleInGroup(groupId: number): T.Person[] {
      const personIds = state.personIdsByGroup[groupId] || [];
      return personIds
        .map((id) => this.getPersonByEmplId(id))
        .filter(Boolean) as T.Person[];
    },

    getAcadApptCountsForGroup(
      groupId: number,
    ): Record<T.Person["academicAppointment"], number> {
      const acadAppts = getters.acadApptCountsByGroup.value[groupId] ?? [];
      return acadAppts;
    },
    getPersonByUserId(userId: T.Person["id"]): T.Person | null {
      return getters.personLookupByUserId.value[userId] ?? null;
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
