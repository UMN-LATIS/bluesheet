<template>
  <div
    data-cy="leavesSection"
    class="tw-bg-neutral-50 tw-p-4 tw-border tw-border-neutral-200 tw-rounded-md"
  >
    <div class="tw-flex tw-justify-between tw-items-center tw-mb-4">
      <h3 class="tw-m-0 tw-text-xl tw-font-bold">Leaves</h3>
      <div class="tw-flex tw-items-center tw-gap-1">
        <template v-if="!isEditing">
          <Button
            variant="secondary"
            v-if="$can('edit leaves')"
            @click="handleEditToggle"
            >Edit</Button
          >
        </template>
        <template v-else>
          <Button variant="tertiary" @click="handleEditToggle">Cancel</Button>
          <Button variant="secondary" @click="handleSaveLeaves">Save</Button>
        </template>
      </div>
    </div>
    <div class="tw-overflow-auto">
      <table
        class="tw-min-w-full tw-divide-y tw-divide-neutral-500"
        data-cy="leavesTable"
      >
        <thead>
          <tr>
            <th
              v-if="isEditing"
              scope="col"
              class="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-sm tw-font-semibold tw-text-neutral-900 sm:tw-pl-0"
            >
              <button
                v-if="isEditing"
                variant="tertiary"
                class="tw-bg-transparent tw-border-0 tw-text-green-600"
                @click="addNewLocalLeave"
              >
                <CirclePlusIcon class="tw-h-6 tw-w-6" />
                <span class="sr-only">Add Leave</span>
              </button>
            </th>
            <th
              scope="col"
              class="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-sm tw-font-semibold tw-text-neutral-900 sm:tw-pl-0"
            >
              Description
            </th>
            <th
              scope="col"
              class="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-sm tw-font-semibold tw-text-neutral-900 sm:tw-pl-0"
            >
              Type
            </th>
            <th
              scope="col"
              class="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-sm tw-font-semibold tw-text-neutral-900 sm:tw-pl-0"
            >
              Status
            </th>
            <th
              scope="col"
              class="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-sm tw-font-semibold tw-text-neutral-900 sm:tw-pl-0"
            >
              Start Date
            </th>
            <th
              scope="col"
              class="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-sm tw-font-semibold tw-text-neutral-900 sm:tw-pl-0"
            >
              End Date
            </th>
            <th
              scope="col"
              class="tw-py-3.5 tw-pl-4 tw-pr-3 tw-text-left tw-text-sm tw-font-semibold tw-text-neutral-900 sm:tw-pl-0"
            >
              Current/Past
            </th>
          </tr>
        </thead>
        <tbody class="tw-divide-y tw-divide-neutral-200">
          <tr v-if="!leavesToShow.length">
            <td
              colspan="5"
              class="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-900 sm:tw-pl-0"
            >
              No leaves to show
            </td>
          </tr>
          <tr
            class="leaves-table-row"
            v-for="(leave, index) in leavesToShow"
            :leave="leave"
            :key="leave.id"
            :class="{
              'tw-bg-red-50': !isLeaveValid(leave),
            }"
          >
            <td
              v-if="isEditing"
              class="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-900 sm:tw-pl-0"
            >
              <button
                class="tw-bg-transparent tw-border-0 tw-text-red-600 tw-mt-1.5"
                @click="handleRemoveLeaveClick(index)"
              >
                <CircleMinusIcon class="tw-w-6 tw-h-6" />
                <span class="sr-only">Delete Leave</span>
              </button>
            </td>
            <td
              class="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-900 sm:tw-pl-0"
            >
              <InputGroup
                v-if="isEditing"
                v-model="leave.description"
                label="description"
                :showLabel="false"
                class="tw-mb-0"
                inputClass="tw-border-neutral-200"
                :isValid="isDescriptionValid(leave.description)"
              />
              <span v-else>{{ leave.description }}</span>
            </td>
            <td
              class="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-900 sm:tw-pl-0"
            >
              <SelectGroup
                v-if="isEditing"
                v-model="localLeaves[index].type"
                :options="leaveTypeOptions"
                :showLabel="false"
                class="tw-mb-0"
                inputClass="tw-border-neutral-200"
                :isValid="isTypeValid(leave.type)"
                label="type"
              />
              <span v-else>{{ leave.type }}</span>
            </td>
            <td>
              <SelectGroup
                v-if="isEditing"
                v-model="localLeaves[index].status"
                :options="leaveStatusOptions"
                :showLabel="false"
                class="tw-mb-0"
                inputClass="tw-border-neutral-200"
                :isValid="isStatusValid(leave.status)"
                label="status"
              />
              <span v-else>{{ leave.status }}</span>
            </td>
            <td
              class="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-900 sm:tw-pl-0"
            >
              <InputGroup
                v-if="isEditing"
                v-model="localLeaves[index].start_date"
                label="start date"
                :showLabel="false"
                class="tw-mb-0"
                inputClass="tw-border-neutral-200"
                type="date"
                :isValid="isStartDateValid(leave.start_date)"
              />
              <span v-else>{{
                dayjs(leave.start_date).format("YYYY-MM-DD")
              }}</span>
            </td>
            <td
              class="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-900 sm:tw-pl-0"
            >
              <InputGroup
                v-if="isEditing"
                v-model="localLeaves[index].end_date"
                label="start date"
                :showLabel="false"
                class="tw-mb-0"
                inputClass="tw-border-neutral-200"
                type="date"
                :isValid="
                  isEndDateValid({
                    startDate: leave.start_date,
                    endDate: leave.end_date,
                  })
                "
              />
              <span v-else>{{
                dayjs(leave.start_date).format("YYYY-MM-DD")
              }}</span>
            </td>
            <td
              class="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-sm tw-font-medium tw-text-neutral-900 sm:tw-pl-0"
            >
              <span
                class="tw-border tw-text-xs tw-py-1 tw-px-2 tw-rounded-full tw-uppercase"
                :class="{
                  'tw-border-green-600 tw-text-green-600':
                    isCurrentOrFutureLeave(leave),
                  'tw-border-neutral-400 tw-text-neutral-400':
                    !isCurrentOrFutureLeave(leave),
                }"
              >
                {{ isCurrentOrFutureLeave(leave) ? "Current" : "Past" }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <button
        v-if="hasPastLeaves"
        class="btn btn-link tw-p-0"
        @click="showPastLeaves = !showPastLeaves"
      >
        {{ showPastLeaves ? "Hide Past" : "Show Past" }}
        <ChevronDownIcon
          class="tw-w-4 tw-h-4"
          :class="{
            'tw-rotate-180': showPastLeaves,
          }"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from "vue";
import { dayjs, $can } from "@/lib";
import {
  Leave,
  LeaveType,
  LeaveStatus,
  UserPermissions,
  leaveStatuses,
  leaveTypes,
  NewLeave,
  ISODate,
} from "@/types";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import Button from "./Button.vue";
import InputGroup from "./InputGroup.vue";
import AddLeaveModal from "./AddLeaveModal.vue";
import * as api from "@/api";
import { cloneDeep, partition } from "lodash";
import SelectGroup from "./SelectGroup.vue";
import { CircleMinusIcon, CirclePlusIcon } from "@/icons";
import { Table, Th, Td } from "@/components/Table";

const props = defineProps<{
  leaves: Leave[];
  userId: number;
}>();

const emit = defineEmits<{
  (eventName: "update", leaves: (Leave | NewLeave)[]);
}>();

const showPastLeaves = ref(false);
const isEditing = ref(false);
const localLeaves = ref<(Leave | NewLeave)[]>([]);

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
  const newLeave: NewLeave = {
    id: `TEMPID-${randomId}`,
    description: "New Leave",
    type: leaveTypes.SABBATICAL,
    status: leaveStatuses.PENDING,
    start_date: dayjs().format("YYYY-MM-DD"),
    end_date: dayjs().add(1, "year").format("YYYY-MM-DD"),
    user_id: props.userId,
  };
  localLeaves.value = [newLeave, ...localLeaves.value];
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

function hasTempId(leave: Leave | NewLeave) {
  return typeof leave.id === "string" && leave.id.includes("TEMPID");
}

const leavesToShow = computed(() => {
  const [newLeaves, existingLeaves] = partition(localLeaves.value, hasTempId);

  // sort existing leaves and if we're not sowing past leaves,
  // only show current leaves
  const sortedAndFilteredExistingLeaves = existingLeaves
    .sort(sortByStartDateDescending)
    .filter((l) => (showPastLeaves.value ? l : isCurrentOrFutureLeave(l)));

  // newLeaves should always be first
  return [...newLeaves, ...sortedAndFilteredExistingLeaves];
});

function handleEditToggle() {
  localLeaves.value = cloneDeep(props.leaves)
    .sort(sortByStartDateDescending)
    .map((leave) => ({
      ...leave,
      start_date: dayjs(leave.start_date).format("YYYY-MM-DD"),
      end_date: dayjs(leave.end_date).format("YYYY-MM-DD"),
    }));
  isEditing.value = !isEditing.value;
}

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

function isLeaveValid(leave) {
  return (
    isDescriptionValid(leave.description) &&
    isTypeValid(leave.type) &&
    isStatusValid(leave.status) &&
    isStartDateValid(leave.start_date) &&
    isEndDateValid({ endDate: leave.end_date, startDate: leave.start_date })
  );
}

async function handleSaveLeaves() {
  // strip ids from new leaves
  const leavesToSave = localLeaves.value.map((leave) => {
    const isNewLeave =
      "id" in leave &&
      typeof leave.id === "string" &&
      leave.id.startsWith("TEMPID-");

    if (isNewLeave) {
      const { id, ...rest } = leave;
      return rest;
    }
    return leave;
  });

  emit("update", leavesToSave);
  isEditing.value = false;
}

function handleRemoveLeaveClick(leaveIndex: number) {
  localLeaves.value.splice(leaveIndex, 1);
}

// if leaves update, then update our list of
// local leaves as well
watch(
  () => props.leaves,
  () => (localLeaves.value = cloneDeep(props.leaves)),
  { immediate: true },
);
</script>
<style scoped>
.table td {
  padding: 0;
}

/* .table {
  & th {
    vertical-align: middle;
    font-size: 0.875rem;
    text-transform: uppercase;
    font-weight: 600;
    color: #333;
    padding: 0.5rem 0;
    border: 0;
    border-bottom: 1px solid #ccc;
  }

  td {
    padding: 0.5rem 1rem;
    padding-left: 0;
    border: 0;
    border-bottom: 1px solid #ccc;
  }
} */
</style>
