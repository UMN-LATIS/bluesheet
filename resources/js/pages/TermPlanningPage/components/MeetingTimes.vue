<template>
  <span class="tw-font-semibold">{{ formatClockWithHalf(startMinute) }}</span>
  <span v-if="hasRoomForEndTime" class="tw-opacity-70">{{
    formatClockWithHalf(endMinute)
  }}</span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatClockWithHalf } from "../helpers/timeScale";

const props = defineProps<{
  startMinute: number;
  endMinute: number;
}>();

/** Below this many minutes tall, only the start time fits. */
const TWO_LINE_MINUTES = 34;

const hasRoomForEndTime = computed(
  () => props.endMinute - props.startMinute >= TWO_LINE_MINUTES,
);
</script>
