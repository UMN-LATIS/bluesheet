import { defineStore } from "pinia";
import { reactive, toRefs, computed } from "vue";
import type { Group } from "@/types";
import * as api from "@/api";

interface GroupsStoreState {
  groupLookup: Record<Group["id"], Group | undefined>;
}

export const useGroupStore = defineStore("groups", () => {
  const state = reactive<GroupsStoreState>({
    groupLookup: {},
  });

  const getters = {
    getGroup: computed(() => (groupId: Group["id"]) => {
      return state.groupLookup[groupId] ?? null;
    }),
  };

  const actions = {
    async fetchGroup(groupId: Group["id"]) {
      const group = await api.fetchGroup(groupId);
      state.groupLookup[groupId] = group;
      return group;
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
