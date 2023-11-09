import { toRefs } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import * as api from "@/api";
import type { Group, Leave, MemberRole, User, UserPermission } from "@/types";

interface UserStoreState {
  currentUserId: User["id"] | null;
  currentUserPermissions: UserPermission[];
  userLookup: Record<User["id"], User>;
}

// // pure functions for selecting data from the store state
const selectors = {
  selectCurrentUser: (state: UserStoreState): User | null => {
    return state.currentUserId ? state.userLookup[state.currentUserId] : null;
  },
};

export const useUserStore = defineStore("user", () => {
  const state = reactive<UserStoreState>({
    currentUserId: null,
    userLookup: {},
    currentUserPermissions: window.Permissions,
  });

  const getters = {
    currentUser: computed((): User | null => {
      return state.currentUserId ? state.userLookup[state.currentUserId] : null;
    }),

    getUser: computed(() => (userId: User["id"]): User | null => {
      return state.userLookup[userId] ?? null;
    }),

    currentGroupFavorites: computed((): Group[] => {
      return getters.currentUser.value?.favoriteGroups ?? [];
    }),
    currentRoleFavorites: computed((): MemberRole[] => {
      return getters.currentUser.value?.favoriteRoles ?? [];
    }),
  };

  const actions = {
    async init() {
      await actions.fetchCurrentUser();
    },

    async fetchCurrentUser() {
      const user = await api.fetchCurrentUser();
      state.currentUserId = user.id;
      state.userLookup[user.id] = user;
    },

    async fetchUser(userId: User["id"]) {
      if (!state.userLookup[userId]) {
        const user = await api.fetchUser(userId);
        state.userLookup[user.id] = user;
      }

      return state.userLookup[userId];
    },

    async updateUserLeaves(userId: User["id"], leaves: Leave[]) {
      const updatedLeaves = await api.updateUserLeaves(userId, leaves);
      state.userLookup[userId].leaves = updatedLeaves;
    },

    async toggleGroupFavorite(groupId: number) {
      const currentUser = selectors.selectCurrentUser(state);
      if (!currentUser) {
        throw new Error("Cannot toggle favorite for null user");
      }

      const isFavorited = currentUser.favoriteGroups.some(
        (g) => g.id === groupId,
      );

      if (isFavorited) {
        await api.deleteGroupFavorite(groupId);
        currentUser.favoriteGroups = currentUser.favoriteGroups.filter(
          (g) => g.id !== groupId,
        );
        return;
      }

      const group = await api.postGroupFavorite(groupId);
      currentUser.favoriteGroups.push(group);
    },

    async toggleRoleFavorite(roleId: number) {
      const currentUser = selectors.selectCurrentUser(state);
      if (!currentUser) {
        throw new Error("Cannot toggle favorite for null user");
      }

      const isFavorited = currentUser.favoriteRoles.some(
        (r) => r.id === roleId,
      );

      if (isFavorited) {
        api.deleteRoleFavorite(roleId);
        currentUser.favoriteRoles = currentUser.favoriteRoles.filter(
          (r) => r.id !== roleId,
        );
        return;
      }

      const role = await api.postRoleFavorite(roleId);
      currentUser.favoriteRoles.push(role);
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
