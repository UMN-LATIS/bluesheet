<template>
  <tr
    data-cy="leaveRow"
    :class="{
      'is-new-leave': isNewLeave,
      'is-invalid-leave tw-bg-red-50': !isLeaveValid,
      'is-past-leave tw-bg-neutral-100':
        !isNewLeave && !isCurrentOrFutureLeave && !isEditing,
      'is-past-leave--editing tw-bg-neutral-100':
        !isNewLeave && !isCurrentOrFutureLeave && isEditing,
    }"
  >
    <Td
      data-cy="leaveDescription"
      class="!tw-whitespace-normal"
      :class="{
        '!tw-p-2': isEditing,
      }"
    >
      <InputGroup
        v-if="isEditing"
        v-model="modelValue.description"
        label="description"
        :showLabel="false"
        :isValid="isDescriptionValid"
      />
      <span v-else>{{ modelValue.description }}</span>
    </Td>
    <Td
      data-cy="leaveType"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <SelectGroup
        v-if="isEditing"
        v-model="modelValue.type"
        :options="leaveTypeOptions"
        :showLabel="false"
        :isValid="isTypeValid"
        label="type"
      />
      <span v-else>{{
        capitalizeEachWord(modelValue.type.replace("_", " "))
      }}</span>
    </Td>
    <Td
      data-cy="leaveStatus"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <SelectGroup
        v-if="isEditing"
        v-model="modelValue.status"
        :options="leaveStatusOptions"
        :showLabel="false"
        :isValid="isStatusValid"
        label="status"
      />
      <Chip v-else :color="statusColor">{{ modelValue.status }}</Chip>
    </Td>
    <Td
      data-cy="leaveStartDate"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <InputGroup
        v-if="isEditing"
        v-model="modelValue.start_date"
        label="start date"
        :showLabel="false"
        type="date"
        :isValid="isStartDateValid"
      />
      <span v-else>{{
        dayjs(modelValue.start_date).format("MMM D, YYYY")
      }}</span>
    </Td>
    <Td
      data-cy="leaveEndDate"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <InputGroup
        v-if="isEditing"
        v-model="modelValue.end_date"
        label="start date"
        :showLabel="false"
        type="date"
        :isValid="isEndDateValid"
      />
      <span v-else>{{ dayjs(modelValue.end_date).format("MMM D, YYYY") }}</span>
    </Td>
    <Td
      v-if="$can('edit leaves')"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <template v-if="isEditing">
        <Button
          variant="tertiary"
          @click="$emit('cancelEdit', leaveSnapshot)"
          class="disabled:hover:tw-bg-transparent disabled:tw-text-neutral-400 disabled:tw-cursor-not-allowed tw-mr-2"
        >
          Cancel
        </Button>

        <Button
          variant="tertiary"
          @click="$emit('save', modelValue)"
          :disabled="!((hasLeaveChanged || isNewLeave) && isLeaveValid)"
          class="!tw-bg-bs-blue tw-text-white disabled:tw-opacity-25"
        >
          Save
        </Button>
      </template>
      <template v-else>
        <Button variant="tertiary" @click="$emit('edit', modelValue)">
          Edit
        </Button>

        <Button
          variant="tertiary"
          @click="$emit('remove', modelValue)"
          class="tw-text-red-500 hover:tw-text-red-600 hover:tw-bg-red-100"
        >
          Delete
        </Button>
      </template>
    </Td>
  </tr>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { dayjs, $can } from "@/lib";
import { Leave, leaveStatuses, leaveTypes, NewLeave } from "@/types";
import Button from "./Button.vue";
import InputGroup from "./InputGroup.vue";
import SelectGroup from "./SelectGroup.vue";
import { Td } from "@/components/Table";
import Chip from "./Chip.vue";
import { cloneDeep, isEqual } from "lodash";

const props = defineProps<{
  modelValue: Leave | NewLeave;
  isEditing: boolean;
}>();

defineEmits<{
  (eventName: "remove", value: Leave | NewLeave);
  (eventName: "save", value: Leave | NewLeave);
  (eventName: "edit", value: Leave | NewLeave);
  (eventName: "cancelEdit", value: Leave | NewLeave);
}>();

const leaveSnapshot = ref<Leave | NewLeave>(props.modelValue);

// when changing edit state, save a snapshot of the leave
watch(
  () => props.isEditing,
  () => {
    if (props.isEditing) {
      leaveSnapshot.value = cloneDeep(props.modelValue);
    }
  },
  { immediate: true },
);

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

const hasLeaveChanged = computed(() => {
  return !isEqual(props.modelValue, leaveSnapshot.value);
});

const isDescriptionValid = computed(() => {
  return props.modelValue.description.length > 0;
});

const isTypeValid = computed(() => {
  return props.modelValue.type.length > 0;
});

const isStatusValid = computed(() => {
  return props.modelValue.status.length > 0;
});

const isStartDateValid = computed(() => {
  return dayjs(props.modelValue.start_date).isValid();
});

const isEndDateValid = computed(() => {
  return (
    dayjs(props.modelValue.end_date).isValid() &&
    dayjs(props.modelValue.end_date).isAfter(dayjs(props.modelValue.start_date))
  );
});

const isLeaveValid = computed(() => {
  return (
    isDescriptionValid.value &&
    isTypeValid.value &&
    isStatusValid.value &&
    isStartDateValid.value &&
    isEndDateValid.value
  );
});

const isCurrentOrFutureLeave = computed(() =>
  dayjs(props.modelValue.end_date).isAfter(dayjs()),
);

const statusColor = computed(() => {
  switch (props.modelValue.status) {
    case leaveStatuses.ELIGIBLE:
      return "blue-600";
    case leaveStatuses.PENDING:
      return "orange-600";
    case leaveStatuses.CONFIRMED:
      return "green-600";
    case leaveStatuses.CANCELLED:
      return "neutral-400";
    default:
      return "neutral-400";
  }
});

const isNewLeave = computed(
  () =>
    !props.modelValue.id ||
    (typeof props.modelValue.id === "string" &&
      props.modelValue.id.includes("TEMPID")),
);
</script>
<style></style>
