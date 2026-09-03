<template>
  <span class="tw-font-semibold">{{ formatClockWithHalf(startMinute) }}</span>
  <span class="end-time tw-opacity-70">
    {{ formatClockWithHalf(endMinute) }}
  </span>
</template>

<script setup lang="ts">
import { formatClockWithHalf } from "../helpers/timeScale";

defineProps<{
  startMinute: number;
  endMinute: number;
}>();
</script>

<style scoped>
/*
 * Only the start time fits on a class shorter than 34 minutes. The block this
 * sits in is the query container, and what it offers is 10px of padding short
 * of the class's length in minutes; see MeetingBlock.
 */
.end-time {
  display: none;
}

@container meeting-block (min-height: 24px) {
  .end-time {
    display: block;
  }
}
</style>
