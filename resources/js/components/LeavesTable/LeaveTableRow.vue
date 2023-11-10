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
        class="tw-border-none tw-text-neutral-900 tw-bg-neutral-100 hover:tw-bg-neutral-200 tw-rounded-full tw-transition tw-duration-300 tw-inline-flex tw-items-center tw-justify-center tw-w-8 tw-h-8"
        @click="isShowingDetails = !isShowingDetails"
      >
        <ChevronDownIcon
          class="tw-w-6 tw-h-6"
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
        v-model="localLeave.description"
        label="description"
        :showLabel="false"
        :validator="isNotEmptyString"
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
        v-model="localLeave.type"
        :options="leaveTypeOptions"
        :showLabel="false"
        :validator="isNotEmptyString"
        label="type"
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
        v-model="localLeave.status"
        :options="leaveStatusOptions"
        :showLabel="false"
        :validator="isNotEmptyString"
        label="status"
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
        v-model="localLeave.start_date"
        label="start date"
        :showLabel="false"
        type="date"
        :validator="
          (startDate) =>
            areStartAndEndDatesValid(startDate, localLeave.end_date)
        "
        :validateWhenUntouched="true"
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
        v-model="localLeave.end_date"
        label="start date"
        :showLabel="false"
        type="date"
        :validator="
          (endDate) => areStartAndEndDatesValid(localLeave.start_date, endDate)
        "
        :validateWhenUntouched="true"
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
          <SmallButton @click="handleEditClick">Edit</SmallButton>

          <SmallButton variant="danger" @click="handleRemoveClick">
            Delete
          </SmallButton>
        </template>
      </div>
    </Td>
  </tr>
  <LeaveArtifacts
    v-show="isShowingDetails"
    class="tw-bg-neutral-100 tw-shadow-inner"
    :leave="leave"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, reactive } from "vue";
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
  leave: Leave;
}>();

const isShowingDetails = ref(false);
const isNewLeave = computed(() => isTempId(props.leave.id));
const isEditing = ref(isNewLeave.value);

const localLeave = reactive({
  description: props.leave.description,
  type: props.leave.type,
  status: props.leave.status,
  start_date: props.leave.start_date,
  end_date: props.leave.end_date,
});

// sync local leave if props changed are passed in
watch(() => props.leave, resetLocalLeaveToProps);

function resetLocalLeaveToProps() {
  Object.keys(localLeave).forEach((key) => {
    localLeave[key] = props.leave[key];
  });
}

function handleEditClick() {
  isEditing.value = true;
  isShowingDetails.value = true;
}

function handleCancelEditLeave() {
  isEditing.value = false;
  resetLocalLeaveToProps();
}

// when changing edit state, save a snapshot of the leave
// watch(
//   () => props.isEditing,
//   () => {
//     if (props.isEditing) {
//       leaveSnapshot.value = cloneDeep(props.leave);
//       // open the details when editing
//       isShowingDetails.value = true;
//     }
//   },
//   { immediate: true },
// );

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
  return Object.keys(localLeave).some((key) => {
    return !isEqual(localLeave[key], props.leave[key]);
  });
});

const isNotEmptyString = (value: unknown) => value !== "";

// const isDescriptionValid = (description) => {
//   return props.leave.description.length > 0;
// });

// const isTypeValid = computed(() => {
//   return props.leave.type.length > 0;
// });

// const isStatusValid = computed(() => {
//   return props.leave.status.length > 0;
// });

const isStartDateValid = (start_date) => dayjs(start_date).isValid();

const areStartAndEndDatesValid = (startDate: unknown, endDate: unknown) =>
  typeof startDate === "string" &&
  typeof endDate === "string" &&
  dayjs(startDate).isValid() &&
  dayjs(endDate).isValid() &&
  dayjs(endDate).isAfter(dayjs(startDate));

const isLeaveValid = (leave: Leave) =>
  [leave.description, leave.type, leave.status].every(isNotEmptyString) &&
  areStartAndEndDatesValid(leave.start_date, leave.end_date);

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

// function handleCancelEditLeave() {
//   emit("cancelEdit", leaveSnapshot.value);

//   // close the details if there are no artifacts
//   if (!props.leave.artifacts?.length) {
//     isShowingDetails.value = false;
//   }
// }

// function isLeaveNew(leave: Leave | NewLeave): leave is NewLeave {
//   return isTempId(leave.id);
// }

// function isLeave(leave: Leave | NewLeave): leave is Leave {
//   return !isTempId(leave.id);
// }

// const isNewLeave = computed(() => isTempId(props.leave.id));

// function handleUpdateArtifact(artifact: LeaveArtifact) {
//   const artifacts = props.leave.artifacts || [];
//   const index = artifacts.findIndex((a) => a.id === artifact.id);

//   if (index === -1) {
//     throw new Error("cannot update leave artifact: artifact id not found");
//   }
//   const updated = [
//     ...artifacts.slice(0, index),
//     artifact,
//     ...artifacts.slice(index + 1),
//   ];
//   emit("update", { ...props.leave, artifacts: updated });
// }

// function createLeaveArtifact() {
//   if (!props.leave.id) {
//     // this should be the real id or a temp id
//     throw new Error("leave id not defined");
//   }

//   const id = getTempId();
//   const newArtifact: LeaveArtifact = {
//     id,
//     label: "",
//     target: "",
//     leave_id: props.leave.id,
//     created_at: dayjs().toISOString(),
//     updated_at: dayjs().toISOString(),
//   };
//   return newArtifact;
// }

// function handleSaveLeave(updatedLeave: Leave | NewLeave) {
//   emit("save", updatedLeave);

//   // if the leave has no artifacts, close the details
//   if (!updatedLeave.artifacts?.length) {
//     isShowingDetails.value = false;
//   }
// }

// function handleAddArtifact() {
//   const artifacts = props.leave.artifacts || [];
//   const newArtifact = createLeaveArtifact();
//   const updated = [...artifacts, newArtifact];
//   emit("update", { ...props.leave, artifacts: updated });
// }
</script>
<style></style>
