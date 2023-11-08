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
    <Td>
      <button
        v-if="!isNewLeave"
        class="tw-bg-transparent tw-border-none"
        @click="isShowingDetails = !isShowingDetails"
      >
        <ChevronDownIcon
          class="tw-w-6 tw-h-6 tw-text-neutral-400 hover:tw-text-neutral-500"
          :class="{
            'tw-transform -tw-rotate-90': !isShowingDetails,
          }"
        />
        <span class="tw-sr-only">
          {{ isShowingDetails ? "Hide" : "Show" }} Details
        </span>
      </button>
    </Td>
    <Td
      data-cy="leaveDescription"
      class="!tw-whitespace-normal"
      :class="{
        '!tw-p-2': isEditing,
      }"
    >
      <InputGroup
        v-if="isEditing"
        :modelValue="modelValue.description"
        label="description"
        :showLabel="false"
        :isValid="isDescriptionValid"
        @update:modelValue="
          $emit('update', { ...modelValue, description: $event })
        "
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
        :modelValue="modelValue.type"
        :options="leaveTypeOptions"
        :showLabel="false"
        :isValid="isTypeValid"
        label="type"
        @update:modelValue="$emit('update', { ...modelValue, type: $event })"
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
        :modelValue="modelValue.status"
        :options="leaveStatusOptions"
        :showLabel="false"
        :isValid="isStatusValid"
        label="status"
        @update:modelValue="$emit('update', { ...modelValue, status: $event })"
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
        :modelValue="modelValue.start_date"
        label="start date"
        :showLabel="false"
        type="date"
        :isValid="isStartDateValid"
        @update:modelValue="
          $emit('update', { ...modelValue, start_date: $event })
        "
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
        :modelValue="modelValue.end_date"
        label="start date"
        :showLabel="false"
        type="date"
        :isValid="isEndDateValid"
        @update:modelValue="
          $emit('update', { ...modelValue, end_date: $event })
        "
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
          class="disabled:hover:tw-bg-transparent disabled:tw-text-neutral-400 disabled:tw-cursor-not-allowed tw-mr-2"
          @click="$emit('cancelEdit', leaveSnapshot)"
        >
          Cancel
        </Button>

        <Button
          variant="tertiary"
          :disabled="!((hasLeaveChanged || isNewLeave) && isLeaveValid)"
          class="!tw-bg-bs-blue tw-text-white disabled:tw-opacity-25"
          @click="$emit('save', modelValue)"
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
          class="tw-text-red-500 hover:tw-text-red-600 hover:tw-bg-red-100"
          @click="$emit('remove', modelValue)"
        >
          Delete
        </Button>
      </template>
    </Td>
  </tr>
  <LeaveTableDetails
    v-if="isShowingDetails && isLeave(modelValue)"
    class="tw-bg-neutral-100 tw-shadow-inner"
    :leave="modelValue"
    @update="$emit('update', $event)"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { dayjs, $can, getTempId, isTempId } from "@/utils";
import {
  Leave,
  LeaveArtifact,
  leaveStatuses,
  leaveTypes,
  NewLeave,
} from "@/types";
import Button from "./Button.vue";
import InputGroup from "./InputGroup.vue";
import SelectGroup from "./SelectGroup.vue";
import { Td } from "@/components/Table";
import Chip from "./Chip.vue";
import { cloneDeep, isEqual } from "lodash";
import { ChevronDownIcon } from "@/icons";
import LeaveTableDetails from "./LeaveTableDetails.vue";

const props = defineProps<{
  modelValue: Leave | NewLeave;
  isEditing: boolean;
}>();

const emit = defineEmits<{
  (eventName: "remove", value: Leave | NewLeave);
  (eventName: "save", value: Leave | NewLeave);
  (eventName: "edit", value: Leave | NewLeave);
  (eventName: "cancelEdit", value: Leave | NewLeave);
  (eventName: "update", value: Leave | NewLeave);
}>();

const leaveSnapshot = ref<Leave | NewLeave>(props.modelValue);
const isShowingDetails = ref(false);

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

function isLeaveNew(leave: Leave | NewLeave): leave is NewLeave {
  return isTempId(leave.id);
}

function isLeave(leave: Leave | NewLeave): leave is Leave {
  return !isTempId(leave.id);
}

const isNewLeave = computed(() => isTempId(props.modelValue.id));

function handleUpdateArtifact(artifact: LeaveArtifact) {
  const artifacts = props.modelValue.artifacts || [];
  const index = artifacts.findIndex((a) => a.id === artifact.id);

  if (index === -1) {
    throw new Error("cannot update leave artifact: artifact id not found");
  }
  const updated = [
    ...artifacts.slice(0, index),
    artifact,
    ...artifacts.slice(index + 1),
  ];
  emit("update", { ...props.modelValue, artifacts: updated });
}

function createLeaveArtifact() {
  if (!props.modelValue.id) {
    // this should be the real id or a temp id
    throw new Error("leave id not defined");
  }

  const id = getTempId();
  const newArtifact: LeaveArtifact = {
    id,
    label: "",
    target: "",
    leave_id: props.modelValue.id,
    created_at: dayjs().toISOString(),
    updated_at: dayjs().toISOString(),
  };
  return newArtifact;
}

function handleAddArtifact() {
  const artifacts = props.modelValue.artifacts || [];
  const newArtifact = createLeaveArtifact();
  const updated = [...artifacts, newArtifact];
  emit("update", { ...props.modelValue, artifacts: updated });
}
</script>
<style></style>
