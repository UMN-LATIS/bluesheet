<template>
  <Chip
    :color="statusColor"
    :class="[
      'tw-inline-flex tw-items-center tw-gap-1',
      `tw-bg-${statusColor}/5`,
      `tw-border-${statusColor}/40`,
    ]"
    :title="summary"
  >
    <component
      :is="statusIcon"
      class="tw-h-4 tw-w-4 tw-flex-none"
      aria-hidden="true"
    />
    <span class="group-hover:tw-underline">
      <slot>{{ personName }} &middot; {{ typeLabel }}</slot>
    </span>
  </Chip>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import dayjs from "dayjs";
import Chip from "@/components/Chip.vue";
import { CircleCheckIcon, QuestionIcon, SparklesIcon } from "@/icons";
import { leaveStatuses, type TermLeave } from "@/types";
import {
  getLeaveStatusColor,
  getLeaveStatusLabel,
} from "@/utils/leaveStatusHelpers";
import { getLeaveTypeLabel } from "@/utils/leaveTypeHelpers";
import { lastNameFirst } from "../helpers/sectionPeople";

const props = defineProps<{ leave: TermLeave }>();

const leaveStatusToIconMap: Record<TermLeave["status"], Component> = {
  [leaveStatuses.ELIGIBLE]: SparklesIcon,
  [leaveStatuses.PENDING]: QuestionIcon,
  [leaveStatuses.CONFIRMED]: CircleCheckIcon,
};

const statusColor = computed(() => getLeaveStatusColor(props.leave.status));
const statusIcon = computed(() => leaveStatusToIconMap[props.leave.status]);
const typeLabel = computed(() => getLeaveTypeLabel(props.leave.type));

const personName = computed(() => {
  const name = props.leave.name;
  if (!name) return String(props.leave.emplid ?? "Unknown");

  return lastNameFirst(name, props.leave.lastName);
});

const formatLeaveDate = (date: string) => dayjs(date).format("MMM D, YYYY");

const summary = computed(() => {
  const status = getLeaveStatusLabel(props.leave.status);
  const dates = `${formatLeaveDate(props.leave.startDate)} to ${formatLeaveDate(props.leave.endDate)}`;

  return [typeLabel.value, status, dates].join(" · ");
});
</script>
