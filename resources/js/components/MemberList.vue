<template>
  <table class="table">
    <thead>
      <tr>
        <th v-if="filterList" scope="col" width="5%">Filter</th>
        <th scope="col">
          <SortableLink
            sortLabel="Name"
            sortElement="user.surname"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="$emit('sort', $event)"
          />
        </th>
        <th v-if="show_unit && viewType == 'group'" scope="col">
          <SortableLink
            sortLabel="Unit"
            sortElement="user.ou"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="$emit('sort', $event)"
          />
        </th>
        <th v-if="viewType == 'group'" scope="col">
          <SortableLink
            sortLabel="Role"
            sortElement="role.label"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="$emit('sort', $event)"
          />
        </th>

        <th v-if="viewType == 'role'" scope="col">
          <SortableLink
            sortLabel="Group"
            sortElement="group.group_title"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="$emit('sort', $event)"
          />
        </th>

        <th scope="col">
          <SortableLink
            sortLabel="Notes"
            sortElement="notes"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="$emit('sort', $event)"
          />
        </th>

        <th scope="col">
          <SortableLink
            sortLabel="From"
            sortElement="start_date"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="$emit('sort', $event)"
          />
        </th>

        <th v-if="includePreviousMembers || editing" scope="col">
          <SortableLink
            sortLabel="Until"
            sortElement="end_date"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
            @sort="$emit('sort', $event)"
          />
        </th>
        <th v-if="!editing && viewType == 'group'" scope="col" width="11%">
          <SortableLink
            sortLabel="Official Role"
            sortElement="role.official_group_type"
            :currentSort="currentSort"
            :currentSortDir="currentSortDir"
          />
        </th>
        <th
          v-if="viewType === 'group' && editing"
          scope="col"
          class="tw-text-center"
        >
          BlueSheet Manager
        </th>
        <th v-if="editing" scope="col" class="tw-text-center">
          End Active Membership
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="member in filteredList" :key="member.id">
        <td v-if="filterList">
          <input v-model="member.filtered" type="checkbox" />
        </td>

        <td>
          <router-link
            v-if="member.user.id && $can('view users')"
            :to="{ name: 'user', params: { userId: member.user.id } }"
          >
            {{ member.user.surname }}, {{ member.user.givenname }}
          </router-link>
          <span v-if="!member.user.id || !$can('view users')"
            >{{ member.user.surname }}, {{ member.user.givenname }}</span
          >
          <ManagerBadge
            v-if="member.admin && showManagerBadge"
            :showLabel="!editing"
            class="tw-ml-2"
          />
        </td>
        <td v-if="show_unit && viewType == 'group'">{{ member.user.ou }}</td>

        <template v-if="viewType == 'group'">
          <td v-if="!editing">
            {{ member.role.label }}
            <span v-if="member.child_group_title"
              >({{ member.child_group_title }})</span
            >
          </td>
          <td v-if="editing">
            <ComboBox
              v-if="roles"
              v-model="member.role"
              :options="roles"
              :canAddNewOption="true"
              class="tw-min-w-[10rem]"
              @addNewOption="
                (newRole) => $emit('update:roles', [...roles, newRole])
              "
            />
          </td>
        </template>

        <td v-if="viewType == 'role'">
          <router-link
            v-if="member.group.id && $can('edit users')"
            :to="{ name: 'group', params: { groupId: member.group.id } }"
          >
            <GroupTitle :group="member.group" />
          </router-link>
          <span v-if="!member.group.id || !$can('edit users')">{{
            member.group.group_title
          }}</span>
        </td>

        <td v-if="!editing">{{ member.notes }}</td>
        <td v-if="editing">
          <input v-model="member.notes" class="form-control" />
        </td>

        <td v-if="!editing">
          {{
            member.start_date
              ? dayjs(member.start_date).format("YYYY, MMM Do")
              : ""
          }}
        </td>
        <td v-if="editing">
          <input
            type="date"
            class="form-control"
            :value="member.start_date"
            @blur="
              member.start_date = ($event.target as HTMLInputElement).value
            "
          />
        </td>

        <td v-if="includePreviousMembers && !editing">
          <span v-if="member.end_date">{{
            dayjs(member.end_date).format("YYYY, MMM Do")
          }}</span>
        </td>
        <td v-if="editing">
          <input
            type="date"
            class="form-control"
            :value="member.end_date"
            @blur="member.end_date = ($event.target as HTMLInputElement).value"
          />
        </td>

        <td v-if="!editing">
          <i
            v-if="
              viewType == 'group' &&
              member.role.official_group_type &&
              member.role.official_group_type.length > 0
            "
            class="fa fa-check"
          ></i>
          <i v-else class="searchIcon fa fa-close"></i>
        </td>
        <td v-if="viewType === 'group' && editing" class="tw-text-center">
          <input v-model="member.admin" type="checkbox" />
          <label class="sr-only">BlueSheet Manager</label>
        </td>
        <td v-if="editing" class="tw-text-center">
          <button
            class="btn btn-outline-danger"
            @click="$emit('remove', member)"
          >
            <i class="fas fa-user-minus"></i>
            <span class="sr-only">End User Membership</span>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import GroupTitle from "./GroupTitle.vue";
import { dayjs, $can } from "@/utils";
import ComboBox from "./LegacyComboBox.vue";
import SortableLink from "./SortableLink.vue";
import ManagerBadge from "./ManagerBadge.vue";

export default {
  components: {
    GroupTitle,
    ComboBox,
    SortableLink,
    ManagerBadge,
  },
  props: [
    "editing",
    "filteredList",
    "filterList",
    "includePreviousMembers",
    "roles",
    "show_unit",
    "viewType", // "group" or "role"
    "currentSort",
    "currentSortDir",
    "showManagerBadge",
  ],
  emits: ["remove", "update:roles", "sort"],
  methods: {
    dayjs,
    $can,
  },
};
</script>

<style>
.vs__selected-options {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.vs__dropdown-menu {
  width: 300px;
}
</style>
<style scoped>
.table,
.form-control,
button {
  font-size: 0.875rem;
}
</style>
