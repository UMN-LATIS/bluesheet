<template>
  <Modal :show="isOpen" title="Add New Leave" @close="$emit('close')">
    <InputGroup
      data-cy="leaveDescription"
      v-model="modelValue.description"
      label="Description"
      required
      :isValid="isDescriptionValid"
      errorText="Describe your leave"
    />
    <SelectGroup
      data-cy="leaveType"
      v-model="modelValue.type"
      label="Type"
      required
      :isValid="isTypeValid"
      errorText="Select a type"
      :options="leaveTypeOptions"
    />
    <SelectGroup
      data-cy="leaveStatus"
      v-model="modelValue.status"
      label="Status"
      required
      :isValid="isStatusValid"
      errorText="Select a status"
      :options="leaveStatusOptions"
    />
    <InputGroup
      data-cy="leaveStartDate"
      v-model="modelValue.start_date"
      label="Start Date"
      type="date"
      required
      :isValid="isStartDateValid"
    />
    <InputGroup
      data-cy="leaveEndDate"
      v-model="modelValue.end_date"
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
          @click="$emit('save', modelValue)"
          :disabled="!isFormValid"
        >
          Save
        </button>
        <button class="btn btn-link" @click="$emit('close')">Cancel</button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from "vue";
import { dayjs } from "@/lib";
import { NewLeave, Leave } from "@/types";
import Modal from "./Modal.vue";
import InputGroup from "./InputGroup.vue";
import { leaveTypes, leaveStatuses, LeaveType, LeaveStatus } from "@/types";
import SelectGroup from "./SelectGroup.vue";
import Button from "./Button.vue";

const props = defineProps<{
  isOpen: boolean;
  modelValue: NewLeave;
}>();

const emit = defineEmits<{
  (eventName: "close");
  (eventName: "update:modelValue", value: NewLeave);
  (eventName: "save", value: NewLeave);
}>();

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

const isDescriptionValid = computed(
  () => !!localLeave.value.description.length,
);
const isStatusValid = computed(() => !!localLeave.value.status);
const isTypeValid = computed(() => !!localLeave.value.type);
const isStartDateValid = computed(() =>
  dayjs(localLeave.value.start_date).isValid(),
);
const isEndDateValid = computed(
  () =>
    dayjs(localLeave.value.end_date).isValid() &&
    isStartDateValid.value &&
    dayjs(localLeave.value.end_date).isAfter(
      dayjs(localLeave.value.start_date),
    ),
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
  localLeave.value = props.leave;
  emit("close");
}

function handleSave() {
  emit("save", localLeave.value);
  resetForm();
}
</script>
<style scoped></style>
