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
            v-if="group.canCurrentUser.update"
            class="btn btn-outline-primary"
            @click="$emit('update:isEditing', true)"
          >
            Edit Group
          </button>
          <button
            v-else
            class="btn btn-outline-primary"
            @click="requestAChange = true"
          >
            Request a Change
          </button>
        </div>
        <h1><GroupTitle :group="group" /></h1>
        <dl class="tuple-list">
          <template v-if="group.parent_organization && $can('view groups')">
            <dt>Folder</dt>
            <dd>
              <router-link
                :to="{
                  name: 'groupList',
                  params: { parent: group.parent_organization.id },
                }"
                >{{ group.parent_organization.group_title }}</router-link
              >
            </dd>
          </template>
          <template v-if="group.parent_group && $can('view groups')">
            <dt>Parent Group</dt>
            <dd>
              <router-link
                :to="{
                  name: 'group',
                  params: { groupId: group.parent_group.id },
                }"
                >{{ group.parent_group.group_title }}</router-link
              >
            </dd>
          </template>
          <template v-if="group.group_type">
            <dt>Group Type</dt>
            <dd>{{ group.group_type.label }}</dd>
          </template>
          <template v-if="group.google_group">
            <dt>Google Group</dt>
            <dd>{{ group.google_group }}</dd>
          </template>
          <template v-if="group.dept_id">
            <dt>Department ID</dt>
            <dd>{{ group.dept_id }}</dd>
          </template>
          <template v-if="group.private_group">
            <dt>Private Group</dt>
            <dd>
              <CheckIcon />
            </dd>
          </template>
          <template v-if="canViewGroupLeaves && group.dept_id">
            <dt>Reports</dt>
            <dd>
              <router-link :to="`/course-planning/groups/${group.id}`">
                Faculty Leaves Planning Report
              </router-link>
            </dd>
          </template>
          <template v-if="activeChildGroups.length || canCreateSubgroup">
            <dt>Subgroups</dt>
            <dd data-cy="child-groups">
              <ul
                v-if="activeChildGroups.length"
                class="tw-list-none tw-pl-0 tw-m-0"
              >
                <li
                  v-for="child_group in activeChildGroups"
                  :key="child_group.id"
                  class="tw-mb-1"
                >
                  <router-link
                    :to="{ name: 'group', params: { groupId: child_group.id } }"
                    >{{ child_group.group_title }}</router-link
                  >
                </li>
              </ul>
              <Button
                v-if="canCreateSubgroup"
                variant="tertiary"
                class="!tw-bg-bs-blue/10"
                @click="isAddingSubgroup = true"
              >
                Create Subgroup
              </Button>
              <CreateGroup
                :show="isAddingSubgroup"
                :parentGroup="group"
                @close="isAddingSubgroup = false"
              ></CreateGroup>
            </dd>
          </template>
          <template v-if="group.notes">
            <dt>Notes</dt>
            <dd>{{ group.notes }}</dd>
          </template>
          <template v-if="group.artifacts.length">
            <dt>Artifacts</dt>
            <dd>
              <ul
                class="tw-list-none tw-pl-0 tw-m-0"
                data-cy="group-artifacts-list"
              >
                <li v-for="(artifact, index) in group.artifacts" :key="index">
                  <a :href="artifact.target">{{ artifact.label }}</a>
                </li>
              </ul>
            </dd>
          </template>
        </dl>
      </div>
    </div>

    <RequestAChange
      v-if="requestAChange"
      :groupId="group.id"
      @close="requestAChange = false"
    />

    <Members
      :groupType="group.group_type.label"
      :members="group.members"
      :group="group"
      :editing="false"
      :show_unit="Boolean(group.show_unit)"
      :roles="rolesRelatedToGroup"
      viewType="group"
      :downloadTitle="group.group_title ?? 'Unnamed Group'"
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
import { computed, onMounted, ref, watch } from "vue";
import * as T from "@/types";
import { useUserStore } from "@/stores/useUserStore";
import * as api from "@/api";
import { usePermissionsStore } from "@/stores/usePermissionsStore";
import Button from "./Button.vue";
import CreateGroup from "./CreateGroup.vue";
import { CheckIcon } from "@/icons";
import RequestAChange from "./RequestAChange.vue";

const props = defineProps<{
  group: T.Group;
  isEditing: boolean;
}>();

defineEmits<{
  (eventName: "update:isEditing", value: boolean): void;
}>();

const allRoles = ref<T.MemberRole[]>([]);
const userStore = useUserStore();
const permissionsStore = usePermissionsStore();
const canViewGroupLeaves = ref(false);
const canCreateSubgroup = ref(false);
const isAddingSubgroup = ref(false);

const requestAChange = ref(false);

watch(
  () => props.group,
  async () => {
    canViewGroupLeaves.value = await permissionsStore.canViewAnyLeavesForGroup(
      props.group.id,
    );

    canCreateSubgroup.value = await permissionsStore.canCreateSubgroupForGroup(
      props.group.id,
    );
  },
  { immediate: true },
);

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

const activeChildGroups = computed((): T.ChildGroup[] => {
  return props.group.child_groups?.filter((g) => g.active_group) ?? [];
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

.tuple-list {
  max-width: 40rem;
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: 0 1rem;
  align-items: baseline;
  margin-top: 1rem;
  margin-bottom: 1rem;

  & dt {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
  }
}
@media (max-width: 40rem) {
  .tuple-list {
    grid-template-columns: 1fr;
    & dt {
      margin-top: 0.5rem;
    }
  }
}
</style>
