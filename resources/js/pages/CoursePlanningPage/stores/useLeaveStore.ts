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
    getLeavesByPersonId: computed(() => {
      const lookupByUserId = groupBy(getters.leaves.value, "user_id");

      return (personId: T.Person["id"]): T.Leave[] =>
        lookupByUserId[personId] ?? [];
    }),
    getLeavesbyTermId: computed(() => {
      const lookupByTermId = groupBy<T.Leave>(getters.leaves.value, "termId");

      return (termId: T.Term["id"]): T.Leave[] => lookupByTermId[termId] ?? [];
    }),
  };

  const actions = {
    init(groupId: T.Group["id"]): Promise<void> {
      state.activeGroupId = groupId;
      return actions.fetchLeaves();
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
