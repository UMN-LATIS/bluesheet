<template>
  <div
    class="tw-absolute tw-inset-x-1 tw-box-border tw-overflow-hidden tw-rounded tw-border-solid tw-px-1.5 tw-py-1 tw-text-[11px] tw-leading-tight"
    :class="
      isDraft
        ? 'tw-border tw-border-dashed tw-border-umn-maroon tw-bg-umn-maroon/10 tw-text-umn-maroon'
        : 'tw-border tw-border-blue-500 tw-bg-blue-100 tw-text-blue-900'
    "
    :style="{
      top: topOf(startMinute),
      height: heightOf(startMinute, endMinute),
    }"
  >
    <span class="tw-font-semibold">{{ formatClock(startMinute) }}</span>
    <span class="tw-opacity-70"> – {{ formatClock(endMinute) }}</span>
  </div>
</template>

<script setup lang="ts">
import { formatClock, heightOf, topOf } from "../helpers/timeScale";

defineProps<{
  startMinute: number;
  endMinute: number;
  /** While the pointer is still down, before the meeting is committed. */
  isDraft?: boolean;
}>();
</script>
