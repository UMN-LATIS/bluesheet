import { defineStore } from "pinia";
import { toRefs, reactive, computed } from "vue";
import * as api from "../coursePlanningApi";
import * as T from "@/types";

interface LeaveStoreState {
  leaveLookup: Record<T.Leave["id"], T.Leave>;
  leaveIdsByGroup: Record<T.Group["id"], T.Leave["id"][]>;
}

export const useLeaveStore = defineStore("leave", () => {
  const state = reactive<LeaveStoreState>({
    leaveLookup: {},
    leaveIdsByGroup: {},
  });

  const getters = {
    leaves: computed(() => Object.values(state.leaveLookup)),
    leaveLookupByPersonId: computed((): Record<T.Person["id"], T.Leave[]> => {
      return Object.values(state.leaveLookup).reduce((acc, leave) => {
        return {
          ...acc,
          [leave.user_id]: [...(acc[leave.user_id] ?? []), leave],
        };
      }, {});
    }),
    leaveLookupByTermId: computed((): Record<T.Term["id"], T.Leave[]> => {
      const lookup: Record<T.Term["id"], T.Leave[]> = {};
      Object.values(state.leaveLookup).forEach((leave) => {
        if (!leave.termIds?.length) return;

        leave.termIds.forEach((termId) => {
          const existing = lookup[termId] ?? [];
          lookup[termId] = [...existing, leave];
        });
      });
      return lookup;
    }),

    getLeaveLookupByTermForGroup: computed(() => (groupId: T.Group["id"]) => {
      const leaves = methods.getLeavesForGroup(groupId);
      const lookup: Record<T.Term["id"], T.Leave[]> = {};
      leaves?.forEach((leave) => {
        if (!leave.termIds?.length) return;

        leave.termIds.forEach((termId) => {
          const existing = lookup[termId] ?? [];
          lookup[termId] = [...existing, leave];
        });
      });
      return lookup;
    }),

    getLeavesForGroupInTerm: computed(
      () => (groupId: T.Group["id"], termId: T.Term["id"]) => {
        const groupLeaveLookupByTerm =
          getters.getLeaveLookupByTermForGroup.value(groupId);
        return groupLeaveLookupByTerm[termId] ?? [];
      },
    ),
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
  };

  const methods = {
    getLeavesForPerson(personId: T.Person["id"]) {
      return getters.leaveLookupByPersonId.value[personId] ?? [];
    },

    getLeavesForPersonInTerm(personId: T.Person["id"], termId: T.Term["id"]) {
      return getters.leaveLookupByPersonId.value[personId]?.filter(
        (l) => l.termIds?.includes(termId),
      );
    },
    getLeavesForGroup(groupId: T.Group["id"]) {
      return state.leaveIdsByGroup[groupId]?.map((id) => state.leaveLookup[id]);
    },
    getLeavesForTerm(termId: T.Term["id"]) {
      return getters.leaveLookupByTermId.value[termId] ?? [];
    },
    getLeavesForGroupInTerm(groupId: T.Group["id"], termId: T.Term["id"]) {
      const groupLeaveLookupByTerm =
        getters.getLeaveLookupByTermForGroup.value(groupId);
      return groupLeaveLookupByTerm[termId] ?? [];
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
