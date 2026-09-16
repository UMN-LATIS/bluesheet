<template>
  <span
    v-if="statusStyle"
    :title="summary"
    :class="[
      'tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-px-1.5 tw-py-0.5 tw-text-[11px] tw-uppercase tw-leading-none tw-tracking-[0.03em]',
      `tw-text-${statusStyle.color}`,
      `tw-border-${statusStyle.color}/40`,
      `tw-bg-${statusStyle.color}/5`,
    ]"
  >
    <component
      :is="statusStyle.icon"
      class="tw-h-3 tw-w-3 tw-flex-none"
      aria-hidden="true"
    />
    <span aria-hidden="true">Leave</span>
    <span class="tw-sr-only">{{ summary }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TermLeave } from "@/types";
import {
  getLeaveStatusColor,
  getLeaveStatusIcon,
  getLeaveStatusLabel,
} from "@/utils/leaveStatusHelpers";
import { getSpecificLeaveTypeLabel } from "@/utils/leaveTypeHelpers";
import { mostCertainLeaveStatus } from "../helpers/mostCertainLeaveStatus";

const props = defineProps<{ leaves: TermLeave[] }>();

const statusStyle = computed(() => {
  const status = mostCertainLeaveStatus(props.leaves);
  if (status === null) return null;

  return {
    color: getLeaveStatusColor(status),
    icon: getLeaveStatusIcon(status),
  };
});

const summary = computed(() =>
  props.leaves
    .map(
      (leave) =>
        `${getLeaveStatusLabel(leave.status)} ${getSpecificLeaveTypeLabel(leave.type) ?? "Leave"}`,
    )
    .join("; "),
);
</script>
