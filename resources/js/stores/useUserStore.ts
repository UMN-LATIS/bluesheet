import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import * as api from "@/api";
import {
  leaveTypes,
  leaveStatuses,
  type Group,
  type Leave,
  type MemberRole,
  type NormalizedUser,
  type User,
  type LeaveArtifact,
} from "@/types";
import { dayjs, getTempId, isTempId } from "@/utils";

interface UserStoreState {
  currentUserId: User["id"] | null;
  userLookup: Record<User["id"], NormalizedUser | undefined>;
  leaveLookup: Record<Leave["id"], Leave | undefined>;
}

function toNormalizedUser(user: User): NormalizedUser {
  return {
    ...user,
    leaves: user.leaves.map((l) => l.id),
  };
}

interface NormalizedUserParts {
  normUser: NormalizedUser;
  leavesLookup: Record<Leave["id"], Leave | undefined>;
}

function toDenormalizedUser({
  normUser,
  leavesLookup,
}: NormalizedUserParts): User {
  return {
    ...normUser,
    leaves: toLeavesArray(normUser.leaves, leavesLookup),
  };
}

function concatLeavesToLookup(
  currentLookup: Record<Leave["id"], Leave | undefined>,
  leaves: Leave[],
): Record<Leave["id"], Leave> {
  return {
    ...currentLookup,
    ...Object.fromEntries(leaves.map((l) => [l.id, l])),
  };
}

function toLeavesArray(
  leaveIds: Leave["id"][],
  leavesLookup: Record<Leave["id"], Leave | undefined>,
): Leave[] {
  return leaveIds
    .map((id) => leavesLookup[id] ?? null)
    .filter(Boolean) as Leave[];
}

export const useUserStore = defineStore("user", () => {
  const state = reactive<UserStoreState>({
    currentUserId: null,
    userLookup: {},
    leaveLookup: {},
  });

  const getters = {
    currentUser: computed((): User | null => {
      if (!state.currentUserId) return null;
      const normedUser = state.userLookup[state.currentUserId];
      if (!normedUser) return null;
      return toDenormalizedUser({
        normUser: normedUser,
        leavesLookup: state.leaveLookup,
      });
    }),

    currentGroupFavorites: computed((): Group[] => {
      return getters.currentUser.value?.favoriteGroups ?? [];
    }),

    currentRoleFavorites: computed((): MemberRole[] => {
      return getters.currentUser.value?.favoriteRoles ?? [];
    }),

    getUserRef: (userId: User["id"]) =>
      computed((): User | null => {
        const normedUser = state.userLookup[userId] ?? null;
        if (!normedUser) return null;
        return toDenormalizedUser({
          normUser: normedUser,
          leavesLookup: state.leaveLookup,
        });
      }),

    isRoleFavorited: (roleId: number) =>
      computed((): boolean => {
        return getters.currentRoleFavorites.value.some((r) => r.id === roleId);
      }),

    isGroupFavorited: (groupId: number) =>
      computed((): boolean => {
        return getters.currentGroupFavorites.value.some(
          (g) => g.id === groupId,
        );
      }),
  };

  const actions = {
    async init() {
      await actions.loadCurrentUser();
    },

    async loadCurrentUser() {
      const user = await api.fetchCurrentUser();
      state.currentUserId = user.id;
      state.userLookup[user.id] = toNormalizedUser(user);
      state.leaveLookup = concatLeavesToLookup(state.leaveLookup, user.leaves);

      return user;
    },

    async loadUser(userId: User["id"]) {
      const user = await api.fetchUser(userId);

      state.userLookup[user.id] = toNormalizedUser(user);
      state.leaveLookup = concatLeavesToLookup(state.leaveLookup, user.leaves);

      return user;
    },

    addLeaveForUser(userId: User["id"]) {
      const user = state.userLookup[userId];
      if (!user) throw new Error("No user found");

      const newLeave: Leave = {
        id: getTempId(),
        user_id: userId,
        description: "",
        type: leaveTypes.SABBATICAL,
        status: leaveStatuses.PENDING,
        start_date: dayjs().format("YYYY-MM-DD"),
        end_date: dayjs().add(1, "year").format("YYYY-MM-DD"),
        created_at: dayjs().format(),
        updated_at: dayjs().format(),
      };

      user.leaves.push(newLeave.id);
      state.leaveLookup[newLeave.id] = newLeave;
    },

    updateLeaveInStore(existingLeaveId: Leave["id"], updatedLeave: Leave) {
      state.leaveLookup[updatedLeave.id] = updatedLeave;

      // if the leave ids match, we're done
      if (existingLeaveId === updatedLeave.id) {
        return;
      }

      // for id changes, we need to remove the old record,
      delete state.leaveLookup[existingLeaveId];

      // and swap the old and new id's in the normalized
      // user lookup
      const normalizedUser = state.userLookup[updatedLeave.user_id];
      if (!normalizedUser) {
        throw new Error(
          "no user loaded into store, cannot update user's leave array.",
        );
      }
      const leaveIndex = normalizedUser.leaves.findIndex(
        (id) => id === existingLeaveId,
      );
      normalizedUser.leaves.splice(leaveIndex, 1, updatedLeave.id);
    },

    async saveLeave(leave: Leave) {
      const isNewLeave = isTempId(leave.id);
      const updatedLeave = isNewLeave
        ? await api.createLeave(leave)
        : await api.updateLeave(leave);

      actions.updateLeaveInStore(leave.id, updatedLeave);
    },

    removeLeaveFromStore(leaveId: Leave["id"]) {
      const leaveToDelete = state.leaveLookup[leaveId];
      if (!leaveToDelete) return;

      // remove this leave from the normalized user
      const normalizedUser = state.userLookup[leaveToDelete.user_id];
      if (!normalizedUser) return;
      const leaveIndex = normalizedUser.leaves.findIndex(
        (id) => id === leaveId,
      );
      normalizedUser.leaves.splice(leaveIndex, 1);

      // remove the record from the lookup
      delete state.leaveLookup[leaveId];
    },

    async deleteLeave(leaveId: Leave["id"]) {
      await api.deleteLeave(leaveId);
      actions.removeLeaveFromStore(leaveId);
    },

    addArtifactForLeave(leaveId: Leave["id"]) {
      const leave = state.leaveLookup[leaveId];
      if (!leave) {
        throw new Error(
          `Cannot add artifact for leave. No leave found with id '${leaveId}'.`,
        );
      }

      leave.artifacts = leave.artifacts ?? [];

      leave.artifacts.push({
        id: getTempId(),
        leave_id: leaveId,
        label: "",
        target: "",
        created_at: dayjs().format(),
        updated_at: dayjs().format(),
      });
    },

    async saveLeaveArtifact(artifact: LeaveArtifact) {
      const isNewArtifact = isTempId(artifact.id);
      const updatedArtifact = isNewArtifact
        ? await api.createLeaveArtifact(artifact)
        : await api.updateLeaveArtifact(artifact);

      const leave = state.leaveLookup[artifact.leave_id];
      if (!leave) {
        throw new Error(
          `Cannot update leave artifact. No leave found with id '${artifact.leave_id}'.`,
        );
      }

      // make sure the leave has an artifacts array
      leave.artifacts = leave.artifacts ?? [];

      const artifactIndex = leave.artifacts.findIndex(
        (a) => a.id === artifact.id,
      );

      // if artifactIndex is -1, we're adding a new artifact
      leave.artifacts.splice(artifactIndex, 1, updatedArtifact);
    },

    async deleteLeaveArtifact(artifact: LeaveArtifact) {
      const isNewArtifact = isTempId(artifact.id);

      if (!isNewArtifact) {
        await api.deleteLeaveArtifact(artifact);
      }

      const leave = state.leaveLookup[artifact.leave_id];
      if (!leave) {
        throw new Error(
          `Cannot delete leave artifact. No leave found with id '${artifact.leave_id}'.`,
        );
      }

      if (!leave.artifacts) {
        throw new Error(
          `Cannot delete leave artifact. Leave '${leave.id}' has no artifacts array. Which is weird.`,
        );
      }

      const artifactIndex = leave.artifacts.findIndex(
        (a) => a.id === artifact.id,
      );

      if (artifactIndex === -1) {
        throw new Error(
          `Cannot delete leave artifact. No artifact found with id '${artifact.id}'.`,
        );
      }

      leave.artifacts.splice(artifactIndex, 1);
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
