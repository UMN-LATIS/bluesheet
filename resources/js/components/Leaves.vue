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
        <div class="tw-flex tw-items-center tw-gap-1">
          <template v-if="!isEditing">
            <Button
              variant="primary"
              v-if="$can('edit leaves')"
              @click="handleEditToggle"
              >Edit</Button
            >
          </template>
          <template v-else>
            <Button variant="tertiary" @click="handleEditToggle">Cancel</Button>
            <Button variant="primary" @click="handleSaveLeaves">Save</Button>
          </template>
        </div>
      </template>

      <template #thead>
        <tr>
          <Th v-if="isEditing">
            <button
              v-if="isEditing"
              variant="tertiary"
              class="tw-bg-transparent tw-border-0 tw-text-green-600"
              @click="addNewLocalLeave"
            >
              <CirclePlusIcon class="tw-h-6 tw-w-6" />
              <span class="sr-only">Add Leave</span>
            </button>
          </Th>
          <Th>Description</Th>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th>Start Date</Th>
          <Th>End Date</Th>
          <Th>Current/Past</Th>
        </tr>
      </template>

      <tr v-if="!leavesToShow.length">
        <Td colspan="5"> No leaves to show </Td>
      </tr>
      <tr
        v-for="(leave, index) in leavesToShow"
        :key="leave.id"
        :class="{
          'tw-bg-red-50': !isLeaveValid(leave),
          'tw-bg-yellow-100':
            isEditing && hasTempId(leave) && isLeaveValid(leave),
        }"
      >
        <Td v-if="isEditing">
          <button
            class="tw-bg-transparent tw-border-0 tw-text-red-600 tw-mt-1.5"
            @click="handleRemoveLeaveClick(index)"
          >
            <CircleMinusIcon class="tw-w-6 tw-h-6" />
            <span class="sr-only">Delete Leave</span>
          </button>
        </Td>
        <Td>
          <InputGroup
            v-if="isEditing"
            v-model="leave.description"
            label="description"
            :showLabel="false"
            class="tw-mb-0"
            :isValid="isDescriptionValid(leave.description)"
          />
          <span v-else>{{ leave.description }}</span>
        </Td>
        <Td>
          <SelectGroup
            v-if="isEditing"
            v-model="localLeaves[index].type"
            :options="leaveTypeOptions"
            :showLabel="false"
            class="tw-mb-0"
            :isValid="isTypeValid(leave.type)"
            label="type"
          />
          <span v-else>{{ leave.type }}</span>
        </Td>
        <Td>
          <SelectGroup
            v-if="isEditing"
            v-model="localLeaves[index].status"
            :options="leaveStatusOptions"
            :showLabel="false"
            class="tw-mb-0"
            :isValid="isStatusValid(leave.status)"
            label="status"
          />
          <span v-else>{{ leave.status }}</span>
        </Td>
        <Td>
          <InputGroup
            v-if="isEditing"
            v-model="localLeaves[index].start_date"
            label="start date"
            :showLabel="false"
            class="tw-mb-0"
            type="date"
            :isValid="isStartDateValid(leave.start_date)"
          />
          <span v-else>{{ dayjs(leave.start_date).format("YYYY-MM-DD") }}</span>
        </Td>
        <Td>
          <InputGroup
            v-if="isEditing"
            v-model="localLeaves[index].end_date"
            label="start date"
            :showLabel="false"
            class="tw-mb-0"
            type="date"
            :isValid="
              isEndDateValid({
                startDate: leave.start_date,
                endDate: leave.end_date,
              })
            "
          />
          <span v-else>{{ dayjs(leave.start_date).format("YYYY-MM-DD") }}</span>
        </Td>
        <Td>
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
        </Td>
      </tr>

      <tr>
        <Td :colspan="isEditing ? 7 : 6" class="tw-text-center">
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
        </Td>
      </tr>
    </Table>
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
<style>
.leaves-section.leaves-section--is-editing {
  & tr {
    border-top: 0;
  }
  & td {
    padding: 0.25rem 0.5rem;
  }
  & td:first-child,
  & th:first-child {
    padding: 0.25rem;
    text-align: center;
  }
}
</style>
