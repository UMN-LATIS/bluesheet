import { toRefs } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, reactive } from "vue";
import * as api from "@/api";
import type { Group, Leave, MemberRole, User, UserPermission } from "@/types";

interface UserStoreState {
  currentUserId: User["id"] | null;
  currentUserPermissions: UserPermission[];
  userLookup: Record<User["id"], User | undefined>;
}

export const useUserStore = defineStore("user", () => {
  const state = reactive<UserStoreState>({
    currentUserId: null,
    userLookup: {},
    currentUserPermissions: window.Permissions,
  });

  const getters = {
    currentUser: computed((): User | null => {
      if (!state.currentUserId) return null;
      return state.userLookup[state.currentUserId] ?? null;
    }),

    currentGroupFavorites: computed((): Group[] => {
      return getters.currentUser.value?.favoriteGroups ?? [];
    }),

    currentRoleFavorites: computed((): MemberRole[] => {
      return getters.currentUser.value?.favoriteRoles ?? [];
    }),

    getUserRef: (userId: User["id"]) =>
      computed((): User | null => {
        return state.userLookup[userId] ?? null;
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
      const user =
        state.userLookup[userId] ?? (await actions.fetchUser(userId));
      if (!user) {
        throw new Error("Cannot update leaves for null user");
      }
      user.leaves = updatedLeaves;
    },

    async toggleGroupFavorite(group: Group) {
      if (!state.currentUserId) throw new Error("No current user");

      const currentUser = state.userLookup[state.currentUserId];
      if (!currentUser) {
        throw new Error("Cannot toggle favorite for null user");
      }

      const isFavorited = currentUser.favoriteGroups.some(
        (g) => g.id === group.id,
      );

      if (isFavorited) {
        await api.deleteGroupFavorite(group.id);
        currentUser.favoriteGroups = currentUser.favoriteGroups.filter(
          (g) => g.id !== group.id,
        );
        return;
      }

      await api.postGroupFavorite(group.id);
      currentUser.favoriteGroups.push(group);
    },

    async toggleRoleFavorite(role: MemberRole) {
      const currentUser = getters.currentUser.value;
      if (!currentUser) {
        throw new Error("Cannot toggle favorite for null user");
      }

      const isFavorited = currentUser.favoriteRoles.some(
        (r) => r.id === role.id,
      );

      if (isFavorited) {
        api.deleteRoleFavorite(role.id);
        currentUser.favoriteRoles = currentUser.favoriteRoles.filter(
          (r) => r.id !== role.id,
        );
        return;
      }

      await api.postRoleFavorite(role.id);
      currentUser.favoriteRoles.push(role);
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
