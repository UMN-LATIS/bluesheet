<template>
  <Chip
    :color="statusColor"
    class="tw-cursor-pointer"
    :class="[
      `tw-bg-${statusColor}/5 tw-border-${statusColor}/40`,
      {
        'tw-rounded-xl tw-opacity-80': isOpen,
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
      <CircleCheckIcon v-if="leave.status === 'confirmed'" title="confirmed" />
      <QuestionIcon v-if="leave.status === 'pending'" title="pending" />
      <SparklesIcon
        v-if="leave.status === 'eligible' && !isOnlyPartiallyEligible"
        title="eligible"
      />
      <span
        v-if="leave.status === 'eligible' && isOnlyPartiallyEligible"
        class="tw-text-sm"
        >✧</span
      >
      <NoIcon v-if="leave.status === 'cancelled'" title="cancelled" />
      <span
        :class="{
          'tw-line-through': leave.status === 'cancelled',
        }"
      >
        {{ prettyLeaveType }} Leave
      </span>
    </header>
    <div
      v-if="isOpen"
      class="leave-details tw-flex tw-flex-col tw-gap-2 tw-items-center tw-text-xs tw-normal-case"
    >
      <ul class="tw-text-xs tw-pl-6 tw-list-none tw-m-0">
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
import { Leave, leaveStatuses, Instructor, leaveTypes } from "@/types";
import { computed, ref } from "vue";
import dayjs from "dayjs";
import Chip from "./Chip.vue";
import { CircleCheckIcon, QuestionIcon, NoIcon, SparklesIcon } from "@/icons";

const props = withDefaults(
  defineProps<{
    leave: Leave;
    instructor?: Instructor;
  }>(),
  {
    instructor: undefined,
  },
);

const isOpen = ref(false);

const prettyLeaveType = computed(() => props.leave.type.replace(/_/g, " "));
const isOnlyPartiallyEligible = computed(() => {
  const ASST_PROF_JOB_CODE = "9403";
  // assistant professors are only eligible for sabbatical leaves
  return (
    props.leave.type === leaveTypes.SABBATICAL &&
    props.leave.status === leaveStatuses.ELIGIBLE &&
    props.instructor?.jobCode === ASST_PROF_JOB_CODE
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
</script>
