import { defineStore } from "pinia";
import { reactive, toRefs, computed } from "vue";
import type { ChildGroup, Group, GroupType, ParentOrganization } from "@/types";
import * as api from "@/api";

interface GroupsStoreState {
  groupLookup: Record<Group["id"], Group | undefined>;
}

interface NewGroupData {
  groupName: string;
  parentOrganizationId: ParentOrganization["id"];
  groupType: GroupType["label"] | GroupType["id"];
  parentGroupId?: Group["id"];
}

export const useGroupStore = defineStore("group", () => {
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

    // converts a group to a child group
    // groups currently use `active` to determine if they are active
    // while child groups use `active_group` for some reason
    toChildGroup(group: Group): ChildGroup {
      const { active, ...groupWithoutActive } = group;
      return {
        ...groupWithoutActive,
        active_group: active,
      };
    },
    async createGroup(
      ...groupData: Parameters<typeof api.createGroup>
    ): Promise<Group> {
      const newGroup = await api.createGroup(...groupData);

      // Add the new group to the store
      state.groupLookup[newGroup.id] = newGroup;

      // if we're not creating a subgroup, we're done
      if (!newGroup.parent_group_id) {
        return newGroup;
      }

      // if this group has a parent group, update the parent group's children
      const parentGroup =
        state.groupLookup[newGroup.parent_group_id] ??
        (await this.fetchGroup(newGroup.parent_group_id));

      parentGroup.child_groups = [
        ...(parentGroup.child_groups ?? []),
        this.toChildGroup(newGroup),
      ];

      return newGroup;
    },
  };

  return {
    ...toRefs(state),
    ...getters,
    ...actions,
  };
});
