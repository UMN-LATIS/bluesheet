<template>
  <span
    class="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-px-1.5 tw-py-0.5 tw-text-[11px] tw-leading-none"
    :class="[`tw-text-${color}`, `tw-border-${color}/40`, `tw-bg-${color}/5`]"
  >
    <component
      :is="getLeaveStatusIcon(status)"
      class="tw-h-3 tw-w-3 tw-flex-none"
      aria-hidden="true"
    />
    {{ getLeaveStatusLabel(status) }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LeaveStatus } from "@/types";
import {
  getLeaveStatusColor,
  getLeaveStatusIcon,
  getLeaveStatusLabel,
} from "@/utils/leaveStatusHelpers";

const props = defineProps<{ status: LeaveStatus }>();

const color = computed(() => getLeaveStatusColor(props.status));
</script>
