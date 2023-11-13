import { reactive, computed, toRefs } from "vue";
import { MemberRole } from "@/types";
import { defineStore } from "pinia";
import * as api from "@/api";

interface RoleStoreState {
  roleLookup: Record<MemberRole["id"], MemberRole | undefined>;
}

export const useRoleStore = defineStore("role", () => {
  const state = reactive<RoleStoreState>({
    roleLookup: {},
  });

  const getters = {
    getRoleRef: (roleId: MemberRole["id"]) =>
      computed((): MemberRole | undefined => {
        return state.roleLookup[roleId];
      }),
  };

  const actions = {
    async fetchRole(roleId: MemberRole["id"]) {
      const role = await api.fetchRole(roleId);
      state.roleLookup[roleId] = role;
      return role;
    },

    async fetchParentOrganizations() {
      return await api.fetchParentOrganizations();
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
