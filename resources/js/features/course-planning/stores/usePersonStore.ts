import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as api from "../coursePlanningApi";
import * as T from "../coursePlanningTypes";

interface PersonStoreState {
  personLookup: Record<T.Person["emplid"], T.Person | undefined>;
  personIdsByGroup: Record<number, T.Person["id"][] | undefined>;
}

/**
 * a person is a user who is enrolled in a course section
 * TODO: merge with useUserStore
 */
export const usePersonStore = defineStore("person", () => {
  const state = reactive<PersonStoreState>({
    personLookup: {},
    personIdsByGroup: {},
  });

  const getters = {
    allPeople: computed(() => Object.values(state.personLookup)),
  };

  const actions = {
    async fetchPeopleForGroup(groupId: number) {
      const persons = await api.fetchPeopleForGroup(groupId);

      // update the person lookup in one fell swoop
      const updatedPersonLookup = {
        ...state.personLookup,
        ...Object.fromEntries(persons.map((person) => [person.emplid, person])),
      };

      state.personLookup = updatedPersonLookup;

      // update personIdsByGroup list
      state.personIdsByGroup[groupId] = persons.map((person) => person.emplid);
    },
  };

  const methods = {
    /**
     * get a person by id
     */
    getPersonByEmplId(emplId: T.Person["emplid"]): T.Person | null {
      const person = state.personLookup[emplId] ?? null;
      if (!person) {
        console.warn(`no person found with emplid ${emplId}`);
      }
      return person;
    },
    getPeopleForGroup(groupId: number): T.Person[] {
      const personIds = state.personIdsByGroup[groupId] || [];
      return personIds
        .map((id) => this.getPersonByEmplId(id))
        .filter(Boolean) as T.Person[];
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
