<template>
  <div data-cy="leavesSection" class="leaves-section">
    <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
      <h2
        class="tw-text-lg tw-font-semibold tw-leading-6 tw-text-gray-900 tw-mb-0"
      >
        Leaves
      </h2>
      <div class="tw-flex tw-items-center tw-gap-4">
        <CheckboxGroup
          id="show-past-leaves-checkbox"
          v-model="showPastLeaves"
          label="Show Past Leaves"
        />
        <template v-if="$can('edit leaves')">
          <Button
            variant="secondary"
            @click="userStore.addLeaveForUser(userId)"
          >
            Add Leave
          </Button>
        </template>
      </div>
    </div>

    <Table>
      <template #thead>
        <tr>
          <Th>
            <span class="tw-sr-only">Actions</span>
          </Th>
          <Th>Description</Th>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th>Start Date</Th>
          <Th>End Date</Th>
          <Th v-if="$can('edit leaves')"></Th>
        </tr>
      </template>
      <tr v-if="!sortedAndFilteredLeaves.length">
        <Td
          :colspan="$can('edit leaves') ? 6 : 5"
          class="tw-text-center !tw-p-6 tw-italic tw-text-neutral-500"
        >
          No Leaves
        </Td>
      </tr>
      <LeaveTableRow
        v-for="leave in sortedAndFilteredLeaves"
        :key="leave.id"
        :leave="leave"
      />
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { dayjs, $can, isTempId } from "@/utils";
import { Leave } from "@/types";
import Button from "@/components/Button.vue";
import { Table, Th, Td } from "@/components/Table";
import CheckboxGroup from "@/components/CheckboxGroup.vue";
import LeaveTableRow from "./LeaveTableRow.vue";
import { useUserStore } from "@/stores/useUserStore";

const props = defineProps<{
  userId: number;
  leaves: Leave[];
}>();

const userStore = useUserStore();
const showPastLeaves = ref(false);

const sortByStartDateDescending = (a, b) => {
  if (dayjs(a.start_date).isBefore(dayjs(b.start_date))) return 1;
  if (dayjs(a.start_date).isAfter(dayjs(b.start_date))) return -1;
  return 0;
};

const sortNewLeavesFirst = (a, b) => {
  if (isTempId(a.id)) return -1;
  if (isTempId(b.id)) return 1;
  return 0;
};

const sortedAndFilteredLeaves = computed(() => {
  return [...props.leaves]
    .filter((leave) => {
      if (showPastLeaves.value) return true;
      return !dayjs(leave.end_date).isBefore(dayjs());
    })
    .sort(sortByStartDateDescending)
    .sort(sortNewLeavesFirst);
});
</script>
<style></style>
