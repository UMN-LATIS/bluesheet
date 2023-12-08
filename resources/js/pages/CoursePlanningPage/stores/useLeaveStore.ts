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
    leaves: computed(() => Object.values(state.leaveLookup)),
    leaveLookupByPersonId: computed((): Record<T.Person["id"], Leave[]> => {
      return Object.values(state.leaveLookup).reduce((acc, leave) => {
        return {
          ...acc,
          [leave.user_id]: [...(acc[leave.user_id] ?? []), leave],
        };
      }, {});
    }),
    leaveLookupByTermId: computed((): Record<Term["id"], Leave[]> => {
      const lookup: Record<Term["id"], Leave[]> = {};
      Object.values(state.leaveLookup).forEach((leave) => {
        if (!leave.termIds?.length) return;

        leave.termIds.forEach((termId) => {
          const existing = lookup[termId] ?? [];
          lookup[termId] = [...existing, leave];
        });
      });
      return lookup;
    }),

    getLeaveLookupByTermForGroup: computed(() => (groupId: Group["id"]) => {
      const leaves = methods.getLeavesForGroup(groupId);
      const lookup: Record<Term["id"], Leave[]> = {};
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
      () => (groupId: Group["id"], termId: Term["id"]) => {
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

    getLeavesForPersonInTerm(personId: T.Person["id"], termId: Term["id"]) {
      return getters.leaveLookupByPersonId.value[personId]?.filter(
        (l) => l.termIds?.includes(termId),
      );
    },
    getLeavesForGroup(groupId: Group["id"]) {
      return state.leaveIdsByGroup[groupId]?.map((id) => state.leaveLookup[id]);
    },
    getLeavesForTerm(termId: Term["id"]) {
      return getters.leaveLookupByTermId.value[termId] ?? [];
    },
    getLeavesForGroupInTerm(groupId: Group["id"], termId: Term["id"]) {
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
