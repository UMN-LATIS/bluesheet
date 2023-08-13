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
        <div
          class="tw-flex tw-items-center tw-gap-2"
          v-if="$can('edit leaves')"
        >
          <template v-if="!isEditing">
            <Button variant="secondary" @click="addNewLocalLeave">
              Add Leave
            </Button>
            <Button variant="primary" @click="handleEditToggle"> Edit </Button>
          </template>
          <template v-else>
            <Button
              variant="tertiary"
              v-if="isEditing"
              @click="handleEditToggle"
            >
              Cancel
            </Button>
            <Button variant="secondary" @click="addNewLocalLeave">
              Add Leave
            </Button>
            <Button
              variant="primary"
              @click="handleSaveLeaves"
              :disabled="!areAllLeavesValid"
              >Save</Button
            >
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
          <Th v-if="isEditing"></Th>
        </tr>
      </template>
      <tr v-if="!leavesToShow.length">
        <Td
          :colspan="isEditing ? 7 : 6"
          class="tw-text-center !tw-p-6 tw-italic tw-text-neutral-500"
        >
          No Leaves
        </Td>
      </tr>
      <tr
        v-for="(leave, index) in leavesToShow"
        :key="leave.id"
        :class="{
          'is-invalid-leave tw-bg-red-50': !isLeaveValid(leave),
          'is-new-leave tw-bg-yellow-50':
            isEditing && isNewLeave(leave) && isLeaveValid(leave),
          'is-past-leave tw-bg-neutral-100 tw-opacity-40':
            !isNewLeave(leave) && !isCurrentOrFutureLeave(leave) && !isEditing,
          'is-past-leave--editing tw-bg-neutral-100':
            !isNewLeave(leave) && !isCurrentOrFutureLeave(leave) && isEditing,
        }"
      >
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
          <span v-else>{{
            capitalizeEachWord(leave.type.replace("_", " "))
          }}</span>
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
          <Chip v-else :color="getStatusColor(leave.status)">{{
            leave.status
          }}</Chip>
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
          <span v-else>{{
            dayjs(leave.start_date).format("MMM D, YYYY")
          }}</span>
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
          <span v-else>{{ dayjs(leave.end_date).format("MMM D, YYYY") }}</span>
        </Td>
        <Td v-if="isEditing">
          <Button
            variant="tertiary"
            @click="handleRemoveLeaveClick(index)"
            class="tw-text-red-300 hover:tw-text-red-600 hover:tw-bg-red-100"
          >
            Delete
          </Button>
        </Td>
      </tr>

      <tr v-if="!isEditing && hasPastLeaves">
        <Td :colspan="5" class="tw-text-center !tw-p-2">
          <Button
            variant="tertiary"
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
          </Button>
        </Td>
      </tr>
    </Table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
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
import { cloneDeep } from "lodash";
import SelectGroup from "./SelectGroup.vue";
import { Table, Th, Td } from "@/components/Table";
import Chip from "./Chip.vue";

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
  isEditing.value = true;
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

function getStatusColor(status: LeaveStatus) {
  switch (status) {
    case leaveStatuses.PENDING:
      return "orange-600";
    case leaveStatuses.CONFIRMED:
      return "green-600";
    case leaveStatuses.CANCELLED:
      return "neutral-300";
    default:
      return "neutral-300";
  }
}

function isNewLeave(leave: Leave | NewLeave) {
  return typeof leave.id === "string" && leave.id.includes("TEMPID");
}

const leavesToShow = computed(() => {
  // if we're editing, show all the leaves
  // we do this so that the leaves don't jump into past leaves
  // while a user is editing the date
  if (isEditing.value) return localLeaves.value;

  return showPastLeaves.value
    ? props.leaves.sort(sortByStartDateDescending)
    : localLeaves.value.filter(isCurrentOrFutureLeave);
});

function handleEditToggle() {
  isEditing.value = !isEditing.value;
  resetLocalLeaves();
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

const areAllLeavesValid = computed(() => {
  return localLeaves.value.every(isLeaveValid);
});

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

function resetLocalLeaves() {
  localLeaves.value = cloneDeep(props.leaves).sort(sortByStartDateDescending);
}

// if leaves update, then update our list of
// local leaves as well
watch(
  () => props.leaves,
  () => resetLocalLeaves(),
  { immediate: true, deep: true },
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
  & td:last-child,
  & th:last-child {
    padding: 0.25rem;
    text-align: center;
  }
}
</style>
