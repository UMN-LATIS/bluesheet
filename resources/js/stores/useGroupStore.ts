import { defineStore } from "pinia";
import { reactive } from "vue";
import type { Group } from "@/types";

interface GroupsStoreState {
  groupLookup: Record<Group["id"], Group>;
}

export const useGroupStore = defineStore("groups", () => {
  const state = reactive<GroupsStoreState>({
    groupLookup: {},
  });

  const getters = {};

  const actions = {};

  return {
    ...state,
    ...getters,
    ...actions,
  };
});
