<template>
  <div
    data-cy="leavesSection"
    class="leaves-section"
    :class="{
      'leaves-section--is-editing': isEditing,
    }"
  >
    <Table name="Leaves">
      <template #actions>
        <div class="tw-flex tw-items-center tw-gap-2">
          <CheckboxGroup
            v-if="!isEditing"
            id="show-past-leaves-checkbox"
            v-model="showPastLeaves"
            label="Show Past Leaves"
            class="tw-pr-2"
          />
          <template v-if="$can('edit leaves')">
            <Button variant="secondary" @click="addNewLocalLeave">
              Add Leave
            </Button>
          </template>
        </div>
      </template>

      <template #thead>
        <tr>
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
      <tr
        v-for="(leave, index) in leavesToShow"
        :key="leave.id"
        data-cy="leaveRow"
        :class="{
          'is-invalid-leave tw-bg-red-50': !isLeaveValid(leave),
          'is-new-leave tw-bg-blue-50':
            leave.isEditing && hasLeaveChanged(leave) && isLeaveValid(leave),
          'is-past-leave tw-bg-neutral-100 tw-opacity-40':
            !isNewLeave(leave) &&
            !isCurrentOrFutureLeave(leave) &&
            !leave.isEditing,
          'is-past-leave--editing tw-bg-neutral-100':
            !isNewLeave(leave) &&
            !isCurrentOrFutureLeave(leave) &&
            leave.isEditing,
        }"
      >
        <Td
          data-cy="leaveDescription"
          class="!tw-whitespace-normal"
          :class="{
            '!tw-p-2': leave.isEditing,
          }"
        >
          <InputGroup
            v-if="leave.isEditing"
            v-model="leave.description"
            label="description"
            :showLabel="false"
            :isValid="isDescriptionValid(leave.description)"
          />
          <span v-else>{{ leave.description }}</span>
        </Td>
        <Td
          data-cy="leaveType"
          :class="{
            '!tw-px-2 !tw-py-1': leave.isEditing,
          }"
        >
          <SelectGroup
            v-if="leave.isEditing"
            v-model="leave.type"
            :options="leaveTypeOptions"
            :showLabel="false"
            :isValid="isTypeValid(leave.type)"
            label="type"
          />
          <span v-else>{{
            capitalizeEachWord(leave.type.replace("_", " "))
          }}</span>
        </Td>
        <Td
          data-cy="leaveStatus"
          :class="{
            '!tw-px-2 !tw-py-1': leave.isEditing,
          }"
        >
          <SelectGroup
            v-if="leave.isEditing"
            v-model="leave.status"
            :options="leaveStatusOptions"
            :showLabel="false"
            :isValid="isStatusValid(leave.status)"
            label="status"
          />
          <Chip v-else :color="getStatusColor(leave.status)">{{
            leave.status
          }}</Chip>
        </Td>
        <Td
          data-cy="leaveStartDate"
          :class="{
            '!tw-px-2 !tw-py-1': leave.isEditing,
          }"
        >
          <InputGroup
            v-if="leave.isEditing"
            v-model="leave.start_date"
            label="start date"
            :showLabel="false"
            type="date"
            :isValid="isStartDateValid(leave.start_date)"
          />
          <span v-else>{{
            dayjs(leave.start_date).format("MMM D, YYYY")
          }}</span>
        </Td>
        <Td
          data-cy="leaveEndDate"
          :class="{
            '!tw-px-2 !tw-py-1': leave.isEditing,
          }"
        >
          <InputGroup
            v-if="leave.isEditing"
            v-model="leave.end_date"
            label="start date"
            :showLabel="false"
            type="date"
            :isValid="
              isEndDateValid({
                startDate: leave.start_date,
                endDate: leave.end_date,
              })
            "
          />
          <span v-else>{{ dayjs(leave.end_date).format("MMM D, YYYY") }}</span>
        </Td>
        <Td
          v-if="$can('edit leaves')"
          :class="{
            '!tw-px-2 !tw-py-1': leave.isEditing,
          }"
        >
          <template v-if="leave.isEditing">
            <Button
              variant="tertiary"
              @click="handleCancelEditLeave(leave)"
              class="disabled:hover:tw-bg-transparent disabled:tw-text-neutral-400 disabled:tw-cursor-not-allowed tw-mr-2"
            >
              Cancel
            </Button>

            <Button
              variant="tertiary"
              @click="handleSaveLeave(leave)"
              :disabled="!hasLeaveChanged(leave) || !isLeaveValid(leave)"
              class="!tw-bg-bs-blue tw-text-white disabled:tw-opacity-25"
            >
              Save
            </Button>
          </template>
          <template v-else>
            <Button variant="tertiary" @click="leave.isEditing = true">
              Edit
            </Button>

            <Button
              variant="tertiary"
              @click="handleRemoveLeaveClick(leave)"
              class="tw-text-red-500 hover:tw-text-red-600 hover:tw-bg-red-100"
            >
              Delete
            </Button>
          </template>
        </Td>
      </tr>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, reactive } from "vue";
import { dayjs, $can } from "@/lib";
import {
  Leave,
  LeaveType,
  LeaveStatus,
  leaveStatuses,
  leaveTypes,
  NewLeave,
  ISODate,
} from "@/types";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import Button from "./Button.vue";
import InputGroup from "./InputGroup.vue";
import { cloneDeep, partition } from "lodash";
import SelectGroup from "./SelectGroup.vue";
import { Table, Th, Td } from "@/components/Table";
import Chip from "./Chip.vue";
import CheckboxGroup from "./CheckboxGroup.vue";
import * as api from "@/api";

const props = defineProps<{
  userId: number;
  leaves: Leave[];
}>();

const showPastLeaves = ref(false);
const isEditing = ref(false);

type LeaveWithEditState =
  | (Leave & { isEditing: boolean })
  | (NewLeave & { isEditing: boolean });

const localLeaves = reactive([] as LeaveWithEditState[]);

const capitalizeEachWord = (str: string) =>
  str
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");

const leaveTypeOptions = computed(() => {
  return Object.entries(leaveTypes).map(([text, value]) => ({
    value,
    text: capitalizeEachWord(text),
  }));
});

const leaveStatusOptions = computed(() => {
  return Object.entries(leaveStatuses).map(([text, value]) => ({
    value,
    text: capitalizeEachWord(text.replace("_", " ").toLowerCase()),
  }));
});

function addNewLocalLeave() {
  const randomId = Math.floor(Math.random() * 100000);
  const newLeave: LeaveWithEditState = {
    id: `TEMPID-${randomId}`,
    description: "New Leave",
    type: leaveTypes.SABBATICAL,
    status: leaveStatuses.PENDING,
    start_date: dayjs().format("YYYY-MM-DD"),
    end_date: dayjs().add(1, "year").format("YYYY-MM-DD"),
    user_id: props.userId,
    isEditing: true,
  };
  localLeaves.unshift(newLeave);
}

function hasLeaveChanged(leaveWithEditState: LeaveWithEditState): boolean {
  const leave = getLeaveWithoutEditState(leaveWithEditState);

  const savedLeave = props.leaves.find((l) => l.id === leave.id);
  // if we can't find the saved leave, then it must be new

  if (!savedLeave) return true;

  // otherwise, check if props have changed
  return JSON.stringify(leave) !== JSON.stringify(savedLeave);
}

const isCurrentOrFutureLeave = (leave: Leave | NewLeave) =>
  dayjs(leave.end_date).isAfter(dayjs());

const hasPastLeaves = computed(() => {
  return props.leaves.some((leave) => !isCurrentOrFutureLeave(leave));
});

const sortByStartDateDescending = (a, b) => {
  if (dayjs(a.start_date).isBefore(dayjs(b.start_date))) return 1;
  if (dayjs(a.start_date).isAfter(dayjs(b.start_date))) return -1;
  return 0;
};

function getStatusColor(status: LeaveStatus) {
  switch (status) {
    case leaveStatuses.PENDING:
      return "orange-600";
    case leaveStatuses.CONFIRMED:
      return "green-600";
    case leaveStatuses.CANCELLED:
      return "neutral-400";
    default:
      return "neutral-400";
  }
}

function isNewLeave(leave: Leave | NewLeave) {
  return (
    !leave.id || (typeof leave.id === "string" && leave.id.includes("TEMPID"))
  );
}

const leavesToShow = computed(() => {
  return localLeaves.filter((leave) => {
    if (leave.isEditing) return true;
    if (showPastLeaves.value) return true;
    return isCurrentOrFutureLeave(leave);
  });
});

function isDescriptionValid(description: string) {
  return description.length > 0;
}

function isTypeValid(type: LeaveType) {
  return type.length > 0;
}

function isStatusValid(status: LeaveStatus) {
  return status.length > 0;
}

function isStartDateValid(startDate: ISODate) {
  return dayjs(startDate).isValid();
}

function isEndDateValid({
  endDate,
  startDate,
}: {
  endDate: ISODate;
  startDate: ISODate;
}) {
  return dayjs(endDate).isValid() && dayjs(endDate).isAfter(dayjs(startDate));
}

function isLeaveValid(leave: LeaveWithEditState) {
  return (
    isDescriptionValid(leave.description) &&
    isTypeValid(leave.type) &&
    isStatusValid(leave.status) &&
    isStartDateValid(leave.start_date) &&
    isEndDateValid({ endDate: leave.end_date, startDate: leave.start_date })
  );
}

function getLeaveWithoutEditState(leave: LeaveWithEditState): Leave | NewLeave {
  const { isEditing, ...leaveToSave } = leave;
  return leaveToSave;
}

function removeFromLocalLeaves(leaveId: string | number) {
  const index = localLeaves.findIndex((l) => l.id === leaveId);
  if (index === -1) {
    throw new Error("Leave not found in localLeaves");
  }
  localLeaves.splice(index, 1);
}

async function handleCancelEditLeave(leaveWithEditState: LeaveWithEditState) {
  const leave = getLeaveWithoutEditState(leaveWithEditState);

  if (!leave.id) {
    throw new Error("Leave does not have an id");
  }

  const savedLeave = props.leaves.find((l) => l.id === leave.id);

  // if we can't find the saved leave, then it must be new
  // so just remove it from the localLeaves
  if (!savedLeave) {
    removeFromLocalLeaves(leave.id);
    return;
  }

  // otherwsie get the initial leave and replace the localLeave
  const index = localLeaves.findIndex((l) => l.id === leave.id);
  if (index === -1) {
    throw new Error("Leave not found in localLeaves");
  }

  localLeaves[index] = { ...savedLeave, isEditing: false };
  resortLocalLeaves();
}

async function handleSaveLeave(leaveWithEditState: LeaveWithEditState) {
  if (!isLeaveValid(leaveWithEditState)) {
    throw new Error("Leave is not valid");
  }

  const leave = getLeaveWithoutEditState(leaveWithEditState);

  const index = localLeaves.findIndex((l) => l.id === leave.id);
  if (isNewLeave(leave)) {
    const newLeave = await api.createLeave(leave);
    localLeaves[index] = { ...newLeave, isEditing: false };
  } else {
    // update existing leave
    const updatedLeave = await api.updateLeave(leave as Leave);
    localLeaves[index] = { ...updatedLeave, isEditing: false };
  }

  resortLocalLeaves();
}

async function handleRemoveLeaveClick(leaveWithEditState: LeaveWithEditState) {
  const leave = getLeaveWithoutEditState(leaveWithEditState);
  if (typeof leave.id !== "number") {
    throw new Error("Leave does not have an id");
  }
  removeFromLocalLeaves(leave.id);
  await api.deleteLeave(leave.id);
  resortLocalLeaves();
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

// if leaves update, then update our list of
// local leaves as well
watch(
  () => props.leaves,
  () => initLocalLeaves(),
  { immediate: true, deep: true },
);
</script>
<style>
/* .leaves-section.leaves-section--is-editing {
  & tr {
    border-top: 0;
  }
  & td {
    padding: 0.25rem 0.5rem;
  }
  & td:last-child,
  & th:last-child {
    padding: 0.25rem;
    text-align: center;
  }
} */
</style>
