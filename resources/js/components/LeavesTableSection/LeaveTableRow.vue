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
        v-if="!isNewLeave && (isEditing || leave.artifacts?.length)"
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
        :modelValue="leave.description"
        label="description"
        :showLabel="false"
        :isValid="isDescriptionValid"
        @update:modelValue="$emit('update', { ...leave, description: $event })"
      />
      <span v-else>{{ leave.description }}</span>
    </Td>
    <Td
      data-cy="leaveType"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <SelectGroup
        v-if="isEditing"
        :modelValue="leave.type"
        :options="leaveTypeOptions"
        :showLabel="false"
        :isValid="isTypeValid"
        label="type"
        @update:modelValue="$emit('update', { ...leave, type: $event })"
      />
      <span v-else>{{ capitalizeEachWord(leave.type.replace("_", " ")) }}</span>
    </Td>
    <Td
      data-cy="leaveStatus"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <SelectGroup
        v-if="isEditing"
        :modelValue="leave.status"
        :options="leaveStatusOptions"
        :showLabel="false"
        :isValid="isStatusValid"
        label="status"
        @update:modelValue="$emit('update', { ...leave, status: $event })"
      />
      <Chip v-else :color="statusColor">{{ leave.status }}</Chip>
    </Td>
    <Td
      data-cy="leaveStartDate"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <InputGroup
        v-if="isEditing"
        :modelValue="leave.start_date"
        label="start date"
        :showLabel="false"
        type="date"
        :isValid="isStartDateValid"
        @update:modelValue="$emit('update', { ...leave, start_date: $event })"
      />
      <span v-else>{{ dayjs(leave.start_date).format("MMM D, YYYY") }}</span>
    </Td>
    <Td
      data-cy="leaveEndDate"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <InputGroup
        v-if="isEditing"
        :modelValue="leave.end_date"
        label="start date"
        :showLabel="false"
        type="date"
        :isValid="isEndDateValid"
        @update:modelValue="$emit('update', { ...leave, end_date: $event })"
      />
      <span v-else>{{ dayjs(leave.end_date).format("MMM D, YYYY") }}</span>
    </Td>
    <Td v-if="$can('edit leaves')">
      <div class="tw-flex tw-gap-1 tw-justify-end tw-items-center">
        <template v-if="isEditing">
          <SmallButton @click="handleCancelEditLeave">Cancel</SmallButton>

          <SmallButton
            variant="primary"
            :disabled="!((hasLeaveChanged || isNewLeave) && isLeaveValid)"
            @click="handleSaveLeave(leave)"
          >
            Save
          </SmallButton>
        </template>
        <template v-else>
          <SmallButton @click="$emit('edit', leave)">Edit</SmallButton>

          <SmallButton variant="danger" @click="$emit('remove', leave)">
            Delete
          </SmallButton>
        </template>
      </div>
    </Td>
  </tr>
  <LeaveArtifacts
    v-if="isShowingDetails && isLeave(leave)"
    class="tw-bg-neutral-100 tw-shadow-inner"
    :leave="leave"
    :isEditing="isEditing"
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
import Button from "@/components/Button.vue";
import InputGroup from "@/components/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup.vue";
import { Td } from "@/components/Table";
import Chip from "@/components/Chip.vue";
import { cloneDeep, isEqual } from "lodash";
import { ChevronDownIcon } from "@/icons";
import LeaveArtifacts from "./LeaveArtifacts.vue";
import SmallButton from "./SmallButton.vue";

const props = defineProps<{
  leave: Leave | NewLeave;
  isEditing: boolean;
}>();

const emit = defineEmits<{
  (eventName: "remove", value: Leave | NewLeave);
  (eventName: "save", value: Leave | NewLeave);
  (eventName: "edit", value: Leave | NewLeave);
  (eventName: "cancelEdit", value: Leave | NewLeave);
  (eventName: "update", value: Leave | NewLeave);
}>();

const leaveSnapshot = ref<Leave | NewLeave>(props.leave);
const isShowingDetails = ref(false);

// when changing edit state, save a snapshot of the leave
watch(
  () => props.isEditing,
  () => {
    if (props.isEditing) {
      leaveSnapshot.value = cloneDeep(props.leave);
      // open the details when editing
      isShowingDetails.value = true;
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
  return !isEqual(props.leave, leaveSnapshot.value);
});

const isDescriptionValid = computed(() => {
  return props.leave.description.length > 0;
});

const isTypeValid = computed(() => {
  return props.leave.type.length > 0;
});

const isStatusValid = computed(() => {
  return props.leave.status.length > 0;
});

const isStartDateValid = computed(() => {
  return dayjs(props.leave.start_date).isValid();
});

const isEndDateValid = computed(() => {
  return (
    dayjs(props.leave.end_date).isValid() &&
    dayjs(props.leave.end_date).isAfter(dayjs(props.leave.start_date))
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
  dayjs(props.leave.end_date).isAfter(dayjs()),
);

const statusColor = computed(() => {
  switch (props.leave.status) {
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

function handleCancelEditLeave() {
  emit("cancelEdit", leaveSnapshot.value);

  // close the details if there are no artifacts
  if (!props.leave.artifacts?.length) {
    isShowingDetails.value = false;
  }
}

function isLeaveNew(leave: Leave | NewLeave): leave is NewLeave {
  return isTempId(leave.id);
}

function isLeave(leave: Leave | NewLeave): leave is Leave {
  return !isTempId(leave.id);
}

const isNewLeave = computed(() => isTempId(props.leave.id));

function handleUpdateArtifact(artifact: LeaveArtifact) {
  const artifacts = props.leave.artifacts || [];
  const index = artifacts.findIndex((a) => a.id === artifact.id);

  if (index === -1) {
    throw new Error("cannot update leave artifact: artifact id not found");
  }
  const updated = [
    ...artifacts.slice(0, index),
    artifact,
    ...artifacts.slice(index + 1),
  ];
  emit("update", { ...props.leave, artifacts: updated });
}

function createLeaveArtifact() {
  if (!props.leave.id) {
    // this should be the real id or a temp id
    throw new Error("leave id not defined");
  }

  const id = getTempId();
  const newArtifact: LeaveArtifact = {
    id,
    label: "",
    target: "",
    leave_id: props.leave.id,
    created_at: dayjs().toISOString(),
    updated_at: dayjs().toISOString(),
  };
  return newArtifact;
}

function handleSaveLeave(updatedLeave: Leave | NewLeave) {
  emit("save", updatedLeave);

  // if the leave has no artifacts, close the details
  if (!updatedLeave.artifacts?.length) {
    isShowingDetails.value = false;
  }
}

function handleAddArtifact() {
  const artifacts = props.leave.artifacts || [];
  const newArtifact = createLeaveArtifact();
  const updated = [...artifacts, newArtifact];
  emit("update", { ...props.leave, artifacts: updated });
}
</script>
<style></style>
