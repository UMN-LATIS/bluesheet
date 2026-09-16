<template>
  <span
    :title="summary"
    :class="[
      'tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-px-1.5 tw-py-0.5 tw-text-[11px] tw-leading-none',
      `tw-text-${statusColor}`,
      `tw-border-${statusColor}/40`,
      `tw-bg-${statusColor}/5`,
    ]"
  >
    <component
      :is="statusIcon"
      class="tw-h-3 tw-w-3 tw-flex-none"
      aria-hidden="true"
    />
    <span class="group-hover:tw-underline">{{ chipLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import type { TermLeave } from "@/types";
import {
  getLeaveStatusColor,
  getLeaveStatusIcon,
  getLeaveStatusLabel,
} from "@/utils/leaveStatusHelpers";
import { getSpecificLeaveTypeLabel } from "@/utils/leaveTypeHelpers";
import { lastNameFirst } from "../helpers/sectionPeople";

const props = defineProps<{ leave: TermLeave }>();

const statusColor = computed(() => getLeaveStatusColor(props.leave.status));
const statusIcon = computed(() => getLeaveStatusIcon(props.leave.status));
const typeLabel = computed(() => getSpecificLeaveTypeLabel(props.leave.type));

const personName = computed(() => {
  const name = props.leave.name;
  if (!name) return String(props.leave.emplid ?? "Unknown");

  return lastNameFirst(name, props.leave.lastName);
});

const chipLabel = computed(() =>
  typeLabel.value
    ? `${personName.value} · ${typeLabel.value}`
    : personName.value,
);

const formatLeaveDate = (date: string) => dayjs(date).format("MMM D, YYYY");

const summary = computed(() => {
  const status = getLeaveStatusLabel(props.leave.status);
  const dates = `${formatLeaveDate(props.leave.startDate)} to ${formatLeaveDate(props.leave.endDate)}`;

  return [typeLabel.value, status, dates].filter(Boolean).join(" · ");
});
</script>
