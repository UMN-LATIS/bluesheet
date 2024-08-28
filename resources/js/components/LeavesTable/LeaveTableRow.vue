<template>
  <tr
    data-cy="leaveRow"
    :class="{
      'is-new-leave tw-bg-blue-50': isNewLeave,
      'is-invalid-leave tw-bg-yellow-50': !isLeaveValid,
      'is-past-leave tw-bg-neutral-100':
        !isNewLeave && !isCurrentOrFutureLeave && !isEditing,
      'is-past-leave--editing tw-bg-neutral-100':
        !isNewLeave && !isCurrentOrFutureLeave && isEditing,
    }"
  >
    <Td>
      <button
        v-show="!isNewLeave"
        class="tw-border-none tw-text-neutral-900 tw-bg-neutral-100 hover:tw-bg-neutral-200 tw-rounded-full tw-transition tw-duration-300 tw-inline-flex tw-items-center tw-justify-center tw-w-8 tw-h-8"
        @click="isShowingDetails = !isShowingDetails"
      >
        <ChevronDownIcon v-if="isShowingDetails" class="tw-w-6 tw-h-6" />
        <ChevronRightIcon v-else class="tw-w-6 tw-h-6" />
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
        :required="true"
        label="description"
        :showLabel="false"
        :validator="isNotEmptyString"
        :validateWhenUntouched="true"
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
      <SelectLeaveDate
        v-if="isEditing"
        variant="start"
        :modelValue="localLeave.start_date"
        :validator="
          (startDate) =>
            areStartAndEndDatesValid(startDate, localLeave.end_date)
        "
        @update:modelValue="(date) => (localLeave.start_date = date ?? '')"
      />
      <span v-else>{{ dayjs(leave.start_date).format("MMM D, YYYY") }}</span>
    </Td>
    <Td
      data-cy="leaveEndDate"
      :class="{
        '!tw-px-2 !tw-py-1': isEditing,
      }"
    >
      <SelectLeaveDate
        v-if="isEditing"
        variant="end"
        :modelValue="localLeave.end_date"
        :validator="
          (endDate) => areStartAndEndDatesValid(localLeave.start_date, endDate)
        "
        @update:modelValue="(date) => (localLeave.end_date = date ?? '')"
      />
      <!-- <InputGroup
        v-if="isEditing"
        v-model="localLeave.end_date"
        label="start date"
        :required="true"
        :showLabel="false"
        type="date"
        :validator="
          (endDate) => areStartAndEndDatesValid(localLeave.start_date, endDate)
        "
        :validateWhenUntouched="true"
      /> -->
      <span v-else>{{ dayjs(leave.end_date).format("MMM D, YYYY") }}</span>
    </Td>
    <Td v-if="canEditLeave">
      <div class="tw-flex tw-gap-1 tw-justify-end tw-items-center">
        <template v-if="isEditing">
          <SmallButton @click="handleCancelEditLeave">Cancel</SmallButton>

          <SmallButton
            variant="primary"
            :disabled="!isLeaveValid || !hasLeaveChanged"
            @click="
              userStore.saveLeave({
                ...leave,
                ...localLeave,
              })
            "
          >
            Save
          </SmallButton>
        </template>
        <template v-else>
          <SmallButton @click="handleEditClick">Edit</SmallButton>

          <SmallButton
            variant="danger"
            @click="userStore.deleteLeave(leave.id)"
          >
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
import { dayjs, isTempId } from "@/utils";
import { Leave, leaveStatuses, leaveTypes } from "@/types";
import InputGroup from "@/components/InputGroup.vue";
import SelectGroup from "@/components/SelectGroup.vue";
import { Td } from "@/components/Table";
import Chip from "@/components/Chip.vue";
import { isEqual } from "lodash";
import { ChevronDownIcon, ChevronRightIcon } from "@/icons";
import LeaveArtifacts from "./LeaveArtifacts.vue";
import SmallButton from "./SmallButton.vue";
import { useUserStore } from "@/stores/useUserStore";
import SelectLeaveDate from "./SelectLeaveDate.vue";

const props = defineProps<{
  leave: Leave;
}>();

const isShowingDetails = ref(false);
const isNewLeave = computed(() => isTempId(props.leave.id));
const isEditing = ref(isNewLeave.value);
const userStore = useUserStore();

const canEditLeave = computed(
  () => isNewLeave.value || props.leave.canCurrentUser?.update || false,
);

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
  if (isNewLeave.value) {
    userStore.removeLeaveFromStore(props.leave.id);
  }

  isEditing.value = false;
  resetLocalLeaveToProps();
}

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

const areStartAndEndDatesValid = (startDate: unknown, endDate: unknown) =>
  typeof startDate === "string" &&
  typeof endDate === "string" &&
  dayjs(startDate).isValid() &&
  dayjs(endDate).isValid() &&
  dayjs(endDate).isAfter(dayjs(startDate));

const isLeaveValid = computed(() => {
  return (
    [localLeave.description, localLeave.type, localLeave.status].every(
      isNotEmptyString,
    ) && areStartAndEndDatesValid(localLeave.start_date, localLeave.end_date)
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
</script>
<style></style>
