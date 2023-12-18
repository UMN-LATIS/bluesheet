<template>
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
          @blur="member.start_date = ($event.target as HTMLInputElement).value"
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
      <td v-if="editing" class="text-right">
        <input
          v-model="member.admin"
          class="form-check-input"
          type="checkbox"
        />
      </td>
      <td v-if="editing">
        <button class="btn btn-danger" @click="$emit('remove', member)">
          <i class="fas fa-user-minus"></i>
        </button>
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts">
import GroupTitle from "./GroupTitle.vue";
import { dayjs, $can } from "@/utils";
import ComboBox from "./ComboBox.vue";

export default {
  components: {
    GroupTitle,
    ComboBox,
  },
  props: [
    "editing",
    "filteredList",
    "filterList",
    "includePreviousMembers",
    "roles",
    "show_unit",
    "viewType",
  ],
  emits: ["remove", "update:roles"],
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
