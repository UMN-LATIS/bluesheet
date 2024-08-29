<template>
  <Chip
    :color="statusColor"
    class="tw-cursor-pointer"
    :class="[
      `tw-bg-${statusColor}/5 tw-border-${statusColor}/40`,
      {
        'tw-rounded-xl tw-opacity-80 tw-pb-2': isOpen,
        '!tw-border-dashed tw-opacity-50': isOnlyPartiallyEligible,
      },
    ]"
    @click="isOpen = !isOpen"
  >
    <header
      class="tw-flex tw-gap-1 tw-items-center"
      :class="{
        'tw-font-bold': isOpen,
      }"
    >
      <CircleCheckIcon v-if="isStatusConfirmed" :title="leaveStatusLabel" />
      <QuestionIcon v-if="isStatusPending" :title="leaveStatusLabel" />
      <SparklesIcon
        v-if="isStatusEligible && !isOnlyPartiallyEligible"
        :title="leaveStatusLabel"
      />
      <span
        v-if="isStatusEligible && isOnlyPartiallyEligible"
        class="tw-text-base tw-w-5 tw-h-5 tw-inline-flex tw-items-center tw-justify-center"
        >✧</span
      >
      <NoIcon v-if="isStatusDeferred" :title="leaveStatusLabel" />
      <div
        :class="{
          'tw-line-through': isStatusDeferred,
        }"
      >
        <span v-if="variant === 'person' && person">
          {{ person.surName }}, {{ person.givenName }}
        </span>
        <span v-else> {{ leaveStatusLabel }} Leave </span>
      </div>
    </header>
    <div
      v-if="isOpen"
      class="leave-details tw-flex tw-flex-col tw-gap-2 tw-items-center tw-text-xs tw-normal-case"
    >
      <ul class="tw-text-xs tw-pl-6 tw-list-none tw-m-0">
        <li v-if="variant === 'person'" class="tw-capitalize">
          {{ leave.type }} Leave
        </li>
        <li class="tw-capitalize">
          {{ isOnlyPartiallyEligible ? "Eligible when Tenured" : leave.status }}
        </li>
        <li>
          {{ dayjs(leave.start_date).format("MMM D, YYYY") }} &ndash;
          {{ dayjs(leave.end_date).format("MMM D, YYYY") }}
        </li>
        <li>{{ leave.description }}</li>
      </ul>
    </div>
  </Chip>
</template>
<script setup lang="ts">
import { type Leave, leaveStatuses, leaveTypes } from "@/types";
import { computed, ref } from "vue";
import dayjs from "dayjs";
import Chip from "@/components/Chip.vue";
import { CircleCheckIcon, QuestionIcon, NoIcon, SparklesIcon } from "@/icons";
import { useCoursePlanningStore } from "../stores/useCoursePlanningStore";
import { getLeaveStatusLabel } from "@/utils/leaveStatusHelpers";

const props = withDefaults(
  defineProps<{
    leave: Leave;
    variant?: "leaveType" | "person";
  }>(),
  {
    variant: "leaveType",
  },
);

const coursePlanningStore = useCoursePlanningStore();

const isOpen = ref(false);
const person = computed(() =>
  coursePlanningStore.personStore.getPersonByUserId(props.leave.user_id),
);

const isOnlyPartiallyEligible = computed(() => {
  const ASST_PROF_JOB_CODE = "9403";

  // asst profs are only partially eligible for sabbatical leaves
  // as they (likely?) lack tenure
  return (
    props.leave.type === leaveTypes.SABBATICAL &&
    props.leave.status === leaveStatuses.ELIGIBLE &&
    person.value?.jobCode === ASST_PROF_JOB_CODE
  );
});

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

const isStatusEligible = computed(
  () => props.leave.status === leaveStatuses.ELIGIBLE,
);
const isStatusPending = computed(
  () => props.leave.status === leaveStatuses.PENDING,
);
const isStatusConfirmed = computed(
  () => props.leave.status === leaveStatuses.CONFIRMED,
);
const isStatusDeferred = computed(
  () => props.leave.status === leaveStatuses.CANCELLED,
);

const leaveStatusLabel = computed(() =>
  getLeaveStatusLabel(props.leave.status),
);
</script>
