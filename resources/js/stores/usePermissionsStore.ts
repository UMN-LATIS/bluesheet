import { defineStore } from "pinia";
import { reactive, toRefs } from "vue";
import * as api from "@/api";
import * as T from "@/types";

declare global {
  interface Window {
    Permissions: T.UserPermission[];
  }
}

interface PermissionsStoreState {
  globalPermissions: T.UserPermission[];
}

export const usePermissionsStore = defineStore("permissions", () => {
  const state = reactive<PermissionsStoreState>({
    globalPermissions: window.Permissions,
  });

  const actions = {
    can(globalPermission: T.UserPermission) {
      return state.globalPermissions.includes(globalPermission);
    },

    async canViewAnyLeavesForUser(
      leaveOwnerId: T.User["id"],
    ): Promise<boolean> {
      const userLeavePermissions = await api.getPermissionsForUserLeaves(
        leaveOwnerId,
      );

      return userLeavePermissions.viewAny;
    },

    async canModifyLeavesForUser(leaveOwnerId: T.User["id"]): Promise<boolean> {
      const userLeavePermissions = await api.getPermissionsForUserLeaves(
        leaveOwnerId,
      );

      return userLeavePermissions.create;
    },
  };

  return {
    ...toRefs(state),
    ...actions,
  };
});
