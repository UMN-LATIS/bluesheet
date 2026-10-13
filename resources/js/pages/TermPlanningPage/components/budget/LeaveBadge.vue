<template>
  <button
    type="button"
    :title="summary"
    :class="[
      'tw-inline-flex tw-max-w-full tw-cursor-pointer tw-items-center tw-gap-1 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-px-1.5 tw-py-0.5 tw-text-[11px] tw-leading-none hover:tw-underline',
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
    <span class="tw-truncate">{{ label }}</span>
  </button>
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

const props = defineProps<{ leave: TermLeave }>();

const statusColor = computed(() => getLeaveStatusColor(props.leave.status));
const statusIcon = computed(() => getLeaveStatusIcon(props.leave.status));
const typeLabel = computed(
  () => getSpecificLeaveTypeLabel(props.leave.type) ?? "Leave",
);

const label = computed(
  () =>
    `${typeLabel.value} · ${dayjs(props.leave.startDate).format("MMM D")} – ${dayjs(props.leave.endDate).format("MMM D")}`,
);

const summary = computed(() => {
  const dates = `${dayjs(props.leave.startDate).format("MMM D, YYYY")} to ${dayjs(props.leave.endDate).format("MMM D, YYYY")}`;
  return `${typeLabel.value} · ${getLeaveStatusLabel(props.leave.status)} · ${dates}`;
});
</script>
