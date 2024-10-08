import { defineStore } from "pinia";
import { toRefs, reactive, computed } from "vue";
import * as api from "@/api";
import * as T from "@/types";
import { groupBy, keyBy } from "lodash";

interface LeaveStoreState {
  activeGroupId: T.Group["id"] | null;
  leaveLookup: Record<T.Leave["id"], T.Leave>;
}

export const useLeaveStore = defineStore("leave", () => {
  const state = reactive<LeaveStoreState>({
    activeGroupId: null,
    leaveLookup: {},
  });

  const getters = {
    leaves: computed((): T.Leave[] => Object.values(state.leaveLookup)),
    getLeavesByUserId: computed(() => {
      const lookupByUserId = groupBy(getters.leaves.value, "user_id");

      return (personId: T.Person["id"]): T.Leave[] =>
        lookupByUserId[personId] ?? [];
    }),
    getLeavesByTermId: computed(() => {
      const lookupByTermId: Record<T.Term["id"], T.Leave[]> = {};

      getters.leaves.value.forEach((leave) => {
        if (!leave?.termIds) {
          return;
        }

        leave.termIds.forEach((termId) => {
          if (!lookupByTermId[termId]) {
            lookupByTermId[termId] = [];
          }

          lookupByTermId[termId].push(leave);
        });
      });

      return (termId: T.Term["id"]): T.Leave[] => lookupByTermId[termId] ?? [];
    }),
  };

  const actions = {
    init(groupId: T.Group["id"]) {
      state.activeGroupId = groupId;
      return Promise.all([actions.fetchLeaves()]);
    },

    async fetchLeaves() {
      if (!state.activeGroupId) {
        throw new Error("activeGroupId is null");
      }
      const leaves = await api.fetchLeavesForGroup(state.activeGroupId);
      state.leaveLookup = keyBy(leaves, "id");
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
