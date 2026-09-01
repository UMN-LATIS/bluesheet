<template>
  <div class="tw-ml-1 tw-w-11 tw-flex-none">
    <ColumnHeader>{{ name }}</ColumnHeader>
    <div class="tw-relative" :style="{ height: COLUMN_HEIGHT }">
      <div
        v-for="period in periods"
        :key="period.startMinute"
        class="tw-absolute tw-inset-x-0 tw-box-border tw-flex tw-flex-col tw-justify-between tw-overflow-hidden tw-rounded-sm tw-border-0 tw-border-l-2 tw-border-solid tw-px-1 tw-py-0.5 tw-text-[10px] tw-leading-none tw-text-neutral-600"
        :class="TONE_CLASSES[tone]"
        :style="{
          top: topOf(period.startMinute),
          height: heightOf(period.startMinute, period.endMinute),
        }"
        :title="`${name} · ${formatTime(period.startMinute)} – ${formatTime(period.endMinute)}`"
      >
        <!--
          The two labels sit at the top and bottom of the block, so where a
          time is printed matches the moment it names.
        -->
        <span>{{ formatClock(period.startMinute) }}</span>
        <span class="tw-text-neutral-400">{{
          formatClock(period.endMinute)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ColumnHeader from "./ColumnHeader.vue";
import type { MeetingPeriod } from "../constants/standardMeetingTimes";
import {
  COLUMN_HEIGHT,
  formatClock,
  formatTime,
  heightOf,
  topOf,
} from "../helpers/timeScale";

const TONE_CLASSES = {
  blue: "tw-border-blue-400 tw-bg-blue-50",
  green: "tw-border-green-400 tw-bg-green-50",
} as const;

defineProps<{
  /** The schedule's letter, as the policy names it. */
  name: string;
  periods: MeetingPeriod[];
  tone: keyof typeof TONE_CLASSES;
}>();
</script>
