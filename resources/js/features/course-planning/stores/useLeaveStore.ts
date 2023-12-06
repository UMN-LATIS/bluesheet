import { defineStore } from "pinia";
import { toRefs, reactive } from "vue";
import * as api from "../coursePlanningApi";

export const useLeaveStore = defineStore("leave", () => {
  const state = reactive({
    leaveLookup: {},
    leaveIdsByGroup: {},
  });

  const getters = {};

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

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
