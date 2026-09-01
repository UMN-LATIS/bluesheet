<template>
  <span class="tw-font-semibold">{{ formatClockWithHalf(startMinute) }}</span>
  <span v-if="hasRoomForEndTime" class="tw-opacity-70">{{
    formatClockWithHalf(endMinute)
  }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatClockWithHalf } from "../helpers/timeScale";

/**
 * A block's start and end times, stacked so `MeetingBlock`'s container can
 * pin one to each edge. The fallback content for a block with no class on
 * it, and what the page shows on a meeting drawn but not yet assigned.
 */
const props = defineProps<{
  startMinute: number;
  endMinute: number;
}>();

/**
 * Two stacked lines and the block's padding need about this much height. A
 * shorter meeting shows only when it starts, rather than printing an end time
 * half cut off.
 */
const TWO_LINE_MINUTES = 34;

const hasRoomForEndTime = computed(
  () => props.endMinute - props.startMinute >= TWO_LINE_MINUTES,
);
</script>
