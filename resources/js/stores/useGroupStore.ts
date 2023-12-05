import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import type { Group } from "@/types";
import * as api from "@/api";

interface GroupsStoreState {
  groupLookup: Record<Group["id"], Group | undefined>;
}

export const useGroupStore = defineStore("groups", () => {
  const state = reactive<GroupsStoreState>({
    groupLookup: {},
  });

  const getters = {};

  const actions = {
    async fetchGroup(groupId: Group["id"]) {
      const group = await api.fetchGroup(groupId);
      state.groupLookup[groupId] = group;
      return group;
    },
  };

  const methods = {
    getGroup(groupId: Group["id"]) {
      return state.groupLookup[groupId] ?? null;
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
    ...methods,
  };
});
