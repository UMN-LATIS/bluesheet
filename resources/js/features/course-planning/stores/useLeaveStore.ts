import { defineStore } from "pinia";
import { toRefs, reactive, computed } from "vue";
import * as api from "../coursePlanningApi";
import { Leave, Group, Term } from "@/types";
import * as T from "../coursePlanningTypes";

interface LeaveStoreState {
  leaveLookup: Record<Leave["id"], Leave>;
  leaveIdsByGroup: Record<Group["id"], Leave["id"][]>;
}

export const useLeaveStore = defineStore("leave", () => {
  const state = reactive<LeaveStoreState>({
    leaveLookup: {},
    leaveIdsByGroup: {},
  });

  const getters = {
    leaveLookupByPersonId: computed((): Record<T.Person["id"], Leave[]> => {
      return Object.values(state.leaveLookup).reduce((acc, leave) => {
        return {
          ...acc,
          [leave.user_id]: [...(acc[leave.user_id] ?? []), leave],
        };
      }, {});
    }),
  };

  const actions = {
    async fetchLeavesForGroup(groupId: number) {
      const leaves = await api.fetchLeavesForGroup(groupId);

      const updatedLeaveLookup = {
        ...state.leaveLookup,
        ...Object.fromEntries(leaves.map((l) => [l.id, l])),
      };

      state.leaveLookup = updatedLeaveLookup;

      state.leaveIdsByGroup[groupId] = leaves.map((l) => l.id);
    },

    getLeavesForPerson(personId: T.Person["id"]) {
      return getters.leaveLookupByPersonId.value[personId] ?? [];
    },

    getLeavesForPersonInTerm(personId: T.Person["id"], termId: Term["id"]) {
      return getters.leaveLookupByPersonId.value[personId]?.filter(
        (l) => l.termIds?.includes(termId),
      );
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
