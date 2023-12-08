<template>
  <div>
    <div class="row">
      <div class="col-md-12">
        <div
          class="btn-group float-right"
          role="group"
          aria-label="Edit Controls"
        >
          <button
            class="btn btn-outline-primary"
            @click="userStore.toggleGroupFavorite(group)"
          >
            <i
              class="fa-star"
              :class="{ fas: isGroupFavorited, far: !isGroupFavorited }"
            ></i>
            Favorite
          </button>
          <button
            v-if="$can('edit groups') || group.user_can_edit"
            class="btn btn-outline-primary"
            @click="$emit('update:isEditing', true)"
          >
            Edit Group
          </button>
        </div>
        <h1><GroupTitle :group="group" /></h1>
        <ul class="groupInfo">
          <li v-if="group.parent_organization && $can('view groups')">
            Folder:
            <strong
              ><router-link
                :to="{
                  name: 'groupList',
                  params: { parent: group.parent_organization.id },
                }"
                >{{ group.parent_organization.group_title }}</router-link
              ></strong
            >
          </li>
          <li v-if="group.parent_group && $can('view groups')">
            Parent Group:
            <strong
              ><router-link
                :to="{
                  name: 'group',
                  params: { groupId: group.parent_group.id },
                }"
                >{{ group.parent_group.group_title }}</router-link
              ></strong
            >
          </li>
          <li v-if="group.group_type">
            Group Type: <strong>{{ group.group_type.label }}</strong>
          </li>
          <li v-if="group.google_group">
            Google Group: <strong>{{ group.google_group }}</strong>
          </li>
          <li v-if="group.dept_id">
            Department ID: <strong>{{ group.dept_id }}</strong>
          </li>
          <li v-if="group.private_group"><strong>Private Group</strong></li>
          <li>{{ group.notes }}</li>
          <li
            v-if="
              group.child_groups?.some((g) => g.active_group) &&
              $can('view groups')
            "
          >
            Sub Groups:
            <ul v-if="group.child_groups">
              <li
                v-for="child_group in group.child_groups.filter(
                  (e) => e.active_group,
                )"
                :key="child_group.id"
              >
                <router-link
                  :to="{ name: 'group', params: { groupId: child_group.id } }"
                  >{{ child_group.group_title }}</router-link
                >
              </li>
            </ul>
          </li>
          <li v-if="$can('schedule departments') && group.dept_id">
            <router-link :to="`/course-planning/groups/${group.id}`">
              Scheduling Report
            </router-link>
          </li>
        </ul>
      </div>
    </div>

    <ul>
      <li v-for="(artifact, index) in group.artifacts" :key="index">
        <a :href="artifact.target">{{ artifact.label }}</a>
      </li>
    </ul>

    <Members
      :groupType="group.group_type.label"
      :members="group.members"
      :group="group"
      :editing="false"
      :show_unit="group.show_unit"
      :roles="rolesRelatedToGroup"
      viewType="group"
      :downloadTitle="group.group_title"
    ></Members>

    <router-link
      v-if="$can('view groups')"
      :to="{ name: 'userList', query: { groupId: group.id } }"
      class="btn btn-outline-secondary"
      >View membership counts</router-link
    >
  </div>
</template>

<script lang="ts" setup>
import GroupTitle from "./GroupTitle.vue";
import Members from "./Members.vue";
import { $can } from "@/utils";
import { computed, onMounted, ref } from "vue";
import * as T from "@/types";
import { useUserStore } from "@/stores/useUserStore";
import * as api from "@/api";

const props = defineProps<{
  group: T.Group;
  isEditing: boolean;
}>();

defineEmits<{
  (eventName: "update:isEditing", value: boolean): void;
}>();

const allRoles = ref<T.MemberRole[]>([]);
const userStore = useUserStore();

const isGroupFavorited = computed(() => {
  return userStore.currentGroupFavorites.some((g) => g.id == props.group.id);
});

const rolesRelatedToGroup = computed(() => {
  return allRoles.value.filter(
    (r) =>
      !r.official_group_type ||
      r.official_group_type
        .map((gt) => gt.label)
        .includes(props.group.group_type.label),
  );
});

onMounted(async () => {
  allRoles.value = await api.fetchAllGroupRoles();
});
</script>

<style scoped></style>

<style scoped>
.row {
  margin-top: 10px;
  margin-bottom: 10px;
}

.groupInfo {
  list-style: none;
}
</style>
