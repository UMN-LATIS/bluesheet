<template>
  <div>
    <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
      <h2
        class="tw-text-lg tw-font-semibold tw-leading-6 tw-text-gray-900 tw-mb-0"
      >
        Roles
      </h2>
      <div class="tw-flex tw-items-center tw-gap-4">
        <CheckboxGroup
          id="show-past-roles-checkbox"
          v-model="showPastRoles"
          label="Show Past Roles"
        />
      </div>
    </div>
    <Table name="Roles">
      <THead>
        <tr>
          <Th>Group</Th>
          <Th>Role</Th>
          <Th>From</Th>
          <Th>Until</Th>
        </tr>
      </THead>
      <TBody>
        <tr v-if="!filteredList.length">
          <Td
            class="tw-text-center !tw-p-6 tw-italic tw-text-neutral-500"
            colspan="4"
          >
            No Roles
          </Td>
        </tr>
        <tr v-for="(membership, index) in filteredList" :key="index">
          <Td>
            <router-link
              v-if="membership.group.id"
              :to="{ name: 'group', params: { groupId: membership.group.id } }"
              ><GroupTitle :group="membership.group"
            /></router-link>
            <span v-if="!membership.group.id"
              ><GroupTitle :group="membership.group"
            /></span>
            <div
              v-if="membership.admin"
              class="tw-inline-flex tw-bg-yellow-50 tw-text-yellow-600 tw-gap-1 tw-items-baseline tw-px-1 tw-rounded-full tw-text-xs tw-border tw-border-solid tw-border-yellow-200 tw-leading-none"
              title="Group Manager"
            >
              <i class="fas fa-shield-alt"></i>
              <span class="tw-uppercase">Manager</span>
            </div>
          </Td>
          <Td>{{ membership.role.label }}</Td>
          <Td>
            {{
              membership.start_date
                ? dayjs(membership.start_date).format("MMM D, YYYY")
                : ""
            }}
          </Td>
          <Td>
            {{
              membership.end_date
                ? dayjs(membership.end_date).format("MMM D, YYYY")
                : ""
            }}
          </Td>
        </tr>
      </TBody>
    </Table>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import GroupTitle from "../components/GroupTitle.vue";
import { dayjs } from "@/utils";
import { Table, Td, Th, THead, TBody } from "@/components/Table";
import { Membership } from "@/types";
import CheckboxGroup from "./CheckboxGroup.vue";

const props = defineProps<{
  memberships: Membership[];
}>();

const showPastRoles = ref(false);

function sortByStartDateAscending(a: Membership, b: Membership) {
  const dateA = dayjs(a.start_date);
  const dateB = dayjs(b.start_date);

  if (dateA.isBefore(dateB)) return -1;
  if (dateA.isAfter(dateB)) return 1;
  return 0;
}
const sortedList = computed((): Membership[] => {
  return [...props.memberships].sort(sortByStartDateAscending);
});

function isCurrentOrFutureRole(role: Membership) {
  return role.end_date == null || dayjs(role.end_date).isAfter(dayjs());
}

const filteredList = computed((): Membership[] => {
  if (showPastRoles.value) return sortedList.value;
  return sortedList.value.filter(isCurrentOrFutureRole);
});

const hasPastRoles = computed((): boolean => {
  return sortedList.value.some((role) => !isCurrentOrFutureRole(role));
});
</script>
