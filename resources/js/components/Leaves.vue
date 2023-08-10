<template>
  <div>
    <div class="tw-flex tw-justify-between tw-items-center my-">
      <h3 class="tw-my-4 tw-text-xl">Leaves</h3>
      <div class="tw-flex tw-gap-2 tw-items-baseline">
        <button
          class="btn btn-outline-primary"
          @click="isAddingNewLeave = true"
        >
          Add Leave
        </button>
      </div>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Type</th>
          <th>Status</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="leave in filteredLeaves" :key="leave.id">
          <td>{{ leave.description }}</td>
          <td>{{ leave.type }}</td>
          <td>{{ leave.status }}</td>
          <td>{{ leave.start_date }}</td>
          <td>{{ leave.end_date }}</td>
          <td>
            <button class="btn btn-outline-primary">Edit</button>
            <button class="btn btn-outline-danger">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <button
      v-if="hasPastLeaves"
      class="btn btn-link"
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
  <Modal
    :show="isAddingNewLeave"
    title="Add New Leave"
    @close="isAddingNewLeave = false"
  >
    <InputGroup
      data-cy="leaveDescription"
      v-model="newLeave.description"
      label="Description"
      required
      :isValid="isDescriptionValid"
      errorText="Describe your leave"
    />
    <SelectGroup
      data-cy="leaveType"
      v-model="newLeave.type"
      label="Type"
      required
      :isValid="isTypeValid"
      errorText="Select a type"
      :options="leaveTypeOptions"
    />
    <SelectGroup
      data-cy="leaveStatus"
      v-model="newLeave.status"
      label="Status"
      required
      :isValid="isStatusValid"
      errorText="Select a status"
      :options="leaveStatusOptions"
    />
    <InputGroup
      data-cy="leaveStartDate"
      v-model="newLeave.start_date"
      label="Start Date"
      type="date"
      required
      :isValid="isStartDateValid"
    />
    <InputGroup
      data-cy="leaveEndDate"
      v-model="newLeave.end_date"
      label="End Date"
      type="date"
      required
      :isValid="isEndDateValid"
    />
    <template #footer>
      <div>
        <button
          data-cy="saveLeave"
          class="btn btn-primary"
          @click="handleAddNewLeave"
          :disabled="!isFormValid"
        >
          Save
        </button>
        <button class="btn btn-link" @click="isAddingNewLeave = false">
          Cancel
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { dayjs, $can } from "@/lib";
import { Leave } from "@/types";
import ChevronDownIcon from "@/icons/ChevronDownIcon.vue";
import Modal from "./Modal.vue";
import InputGroup from "./InputGroup.vue";
import { LeaveTypes, LeaveStatuses, LeaveType, LeaveStatus } from "@/types";
import SelectGroup from "./SelectGroup.vue";
import * as api from "@/api";

const props = defineProps<{
  leaves: Leave[];
  userId: number;
}>();

const emit = defineEmits<{
  (eventName: "update", leaves: Leave[]);
}>();

const showPastLeaves = ref(false);
const isAddingNewLeave = ref(false);
const newLeave = reactive({
  description: "",
  type: "" as "" | LeaveType,
  status: "" as "" | LeaveStatus,
  start_date: "",
  end_date: "",
  user_id: props.userId,
});

const isCurrentLeave = (leave: Leave) =>
  dayjs(leave.end_date).isBefore(dayjs());

const capitalizeEachWord = (str: string) =>
  str
    .toLowerCase()
    .replace(/_/g, " ")
    .split(" ")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");

const leaveTypeOptions = computed(() => {
  return Object.entries(LeaveTypes).map(([text, value]) => ({
    value,
    text: capitalizeEachWord(text),
  }));
});

const leaveStatusOptions = computed(() => {
  return Object.entries(LeaveStatuses).map(([text, value]) => ({
    value,
    text: capitalizeEachWord(text.replace("_", " ").toLowerCase()),
  }));
});

const hasPastLeaves = computed(() => {
  return props.leaves.some((leave) => !isCurrentLeave(leave));
});

const filteredLeaves = computed(() => {
  return showPastLeaves.value
    ? props.leaves
    : props.leaves.filter(isCurrentLeave);
});

const isDescriptionValid = computed(() => !!newLeave.description.length);
const isStatusValid = computed(() => !!newLeave.status);
const isTypeValid = computed(() => !!newLeave.type);
const isStartDateValid = computed(() => dayjs(newLeave.start_date).isValid());
const isEndDateValid = computed(
  () =>
    dayjs(newLeave.end_date).isValid() &&
    isStartDateValid.value &&
    dayjs(newLeave.end_date).isAfter(dayjs(newLeave.start_date)),
);

const isFormValid = computed(
  () =>
    isDescriptionValid.value &&
    isStatusValid.value &&
    isTypeValid.value &&
    isStartDateValid.value &&
    isEndDateValid.value,
);

function resetForm() {
  newLeave.description = "";
  newLeave.type = "";
  newLeave.status = "";
  newLeave.start_date = "";
  newLeave.end_date = "";
}

async function handleAddNewLeave() {
  isAddingNewLeave.value = false;
  const leave = await api.createLeave(newLeave as Leave);
  resetForm();
  emit("updateLeaves", [...props.leaves, leave]);
}
</script>
