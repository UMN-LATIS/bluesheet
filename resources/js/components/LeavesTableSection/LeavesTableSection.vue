<template>
  <div
    data-cy="leavesSection"
    class="leaves-section"
    :class="{
      'leaves-section--is-editing': isEditing,
    }"
  >
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
          <Button variant="secondary" @click="addNewLocalLeave">
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
      <tr v-if="!leavesToShow.length">
        <Td
          :colspan="$can('edit leaves') ? 6 : 5"
          class="tw-text-center !tw-p-6 tw-italic tw-text-neutral-500"
        >
          No Leaves
        </Td>
      </tr>
      <LeaveTableRow
        v-for="(leave, index) in leavesToShow"
        :key="leave.id"
        :leave="leave"
        :isEditing="isEditing(leave)"
        @save="handleSaveLeave"
        @cancelEdit="handleCancelEditLeave"
        @remove="handleRemoveLeaveClick"
        @edit="idsOfLeavesInEditMode.add(leave.id!)"
        @update="localLeaves[index] = $event"
      />
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, reactive } from "vue";
import { dayjs, $can, getTempId, isTempId } from "@/utils";
import { Leave, leaveStatuses, leaveTypes, NewLeave } from "@/types";
import Button from "@/components/Button.vue";
import { cloneDeep } from "lodash";
import { Table, Th, Td } from "@/components/Table";
import CheckboxGroup from "@/components/CheckboxGroup.vue";
import * as api from "@/api";
import LeaveTableRow from "./LeaveTableRow.vue";

const props = defineProps<{
  userId: number;
  leaves: Leave[];
}>();

const showPastLeaves = ref(false);
const localLeaves = reactive([] as (Leave | NewLeave)[]);
const idsOfLeavesInEditMode = reactive(new Set<number | string>());

function addNewLocalLeave() {
  const id = getTempId();
  const newLeave: NewLeave = {
    id,
    description: "",
    type: leaveTypes.SABBATICAL,
    status: leaveStatuses.PENDING,
    start_date: dayjs().format("YYYY-MM-DD"),
    end_date: dayjs().add(1, "year").format("YYYY-MM-DD"),
    user_id: props.userId,
  };
  localLeaves.unshift(newLeave);
  idsOfLeavesInEditMode.add(id);
}

const sortByStartDateDescending = (a, b) => {
  if (dayjs(a.start_date).isBefore(dayjs(b.start_date))) return 1;
  if (dayjs(a.start_date).isAfter(dayjs(b.start_date))) return -1;
  return 0;
};

function isNewLeave(leave: Leave | NewLeave) {
  return isTempId(leave.id);
}

function isEditing(leave: Leave | NewLeave): boolean {
  if (!leave.id) return false;
  return idsOfLeavesInEditMode.has(leave.id);
}

function isPastLeave(leave: Leave | NewLeave): boolean {
  return dayjs(leave.end_date).isBefore(dayjs());
}

const leavesToShow = computed(() => {
  return localLeaves.filter((leave) => {
    if (isEditing(leave)) return true;
    if (showPastLeaves.value) return true;
    return !isPastLeave(leave);
  });
});

function removeFromLocalLeaves(leaveId: string | number) {
  const index = localLeaves.findIndex((l) => l.id === leaveId);
  if (index === -1) {
    throw new Error("Leave not found in localLeaves");
  }
  localLeaves.splice(index, 1);
}

async function handleCancelEditLeave(originalLeave: NewLeave | Leave) {
  if (!originalLeave.id) {
    throw new Error("Leave does not have an id");
  }

  // if we can't find the saved leave, then it must be new
  // so just remove it from the localLeaves
  if (isNewLeave(originalLeave)) {
    removeFromLocalLeaves(originalLeave.id);
    return;
  }

  // otherwsie get the initial leave and replace the localLeave
  const index = localLeaves.findIndex((l) => l.id === originalLeave.id);
  if (index === -1) {
    throw new Error("Leave not found in localLeaves");
  }

  localLeaves[index] = originalLeave;
  idsOfLeavesInEditMode.delete(originalLeave.id);
}

async function handleSaveLeave(leave: Leave | NewLeave) {
  if (!leave.id) throw new Error("Leave does not have an id");
  const updatedLeave: Leave = isNewLeave(leave)
    ? await api.createLeave(leave as NewLeave)
    : await api.updateLeave(leave as Leave);

  // update the localLeaves with the new leave
  const index = localLeaves.findIndex((l) => l.id === leave.id);
  if (index === -1) {
    throw new Error("Leave not found in localLeaves");
  }
  localLeaves[index] = updatedLeave;
  resortLocalLeaves();
  idsOfLeavesInEditMode.delete(leave.id);
}

async function handleRemoveLeaveClick(leave: Leave | NewLeave) {
  if (!leave.id) throw new Error("Leave does not have an id");
  const isConfirmed = confirm(
    `Remove ${leave.type} leave '${leave.description}'?`,
  );
  if (!isConfirmed) return;

  removeFromLocalLeaves(leave.id);

  if (!isNewLeave(leave) && typeof leave.id === "number") {
    await api.deleteLeave(leave.id);
  }
}

function resortLocalLeaves() {
  localLeaves.sort(sortByStartDateDescending);
}

function initLocalLeaves() {
  const initialLeaves = cloneDeep(props.leaves)
    .sort(sortByStartDateDescending)
    .map((l) => ({
      ...l,
      isEditing: false,
    }));
  localLeaves.splice(0, localLeaves.length, ...initialLeaves);
}

watch(
  () => props.leaves,
  () => initLocalLeaves(),
  { immediate: true, deep: true },
);
</script>
<style></style>
