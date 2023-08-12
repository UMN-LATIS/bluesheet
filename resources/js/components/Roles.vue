<template>
  <Table name="Roles">
    <template #thead>
      <tr>
        <Th>Group</Th>
        <Th>Role</Th>
        <Th>From</Th>
        <Th>Until</Th>
      </tr>
    </template>
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
    <tr v-if="hasPastRoles">
      <Td :colspan="5" class="tw-text-center">
        <Button
          variant="tertiary"
          class="btn btn-link tw-p-0"
          @click="showPastRoles = !showPastRoles"
        >
          {{ showPastRoles ? "Hide Past" : "Show Past" }}
          <ChevronDownIcon
            class="tw-w-4 tw-h-4"
            :class="{
              'tw-rotate-180': showPastRoles,
            }"
          />
        </Button>
      </Td>
    </tr>
  </Table>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import GroupTitle from "../components/GroupTitle.vue";
import { dayjs } from "../lib";
import { Table, Td, Th } from "@/components/Table";
import { Membership } from "@/types";
import Button from "./Button.vue";
import { ChevronDownIcon } from "@/icons";

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

// export default {
//   components: {
//     GroupTitle,
//     Table,
//     Td,
//     Th,
//   },
//   props: ["memberships"],
//   data() {
//     return {
//       includePastRoles: false,
//     };
//   },
//   computed: {
//     filteredList: function () {
//       return this.sortedList.filter(
//         function (role) {
//           if (
//             this.includePastRoles ||
//             role.end_date == null ||
//             dayjs(role.end_date).isAfter(dayjs())
//           ) {
//             return role;
//           }
//         }.bind(this),
//       );
//     },
//     sortedList: function () {
//       return [...this.memberships].sort((a, b) => {
//         const dateA = dayjs(a.start_date);
//         const dateB = dayjs(b.start_date);

//         return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
//       });
//     },
//   },
//   methods: {
//     dayjs,
//   },
// };
</script>
