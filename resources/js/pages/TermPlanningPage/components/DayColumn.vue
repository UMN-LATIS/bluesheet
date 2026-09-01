<template>
  <!--
    This project disables Tailwind's preflight, so nothing gives elements a
    default border-style or zeroes their border-width. A box that wants one
    edge therefore reads `tw-border-0 tw-border-<side> tw-border-solid`:
    without the zero, the three sides left at their initial `medium` width
    appear as soon as a style is set.
  -->
  <div
    class="tw-w-[250px] tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-neutral-200 last:tw-border-r-0"
  >
    <ColumnHeader>{{ label }}</ColumnHeader>
    <div
      class="tw-relative tw-cursor-cell tw-select-none"
      :data-day-index="dayIndex"
      :style="{ height: COLUMN_HEIGHT }"
    >
      <!-- The rules are backgrounds rather than borders: a hairline needs no
           box, and this sidesteps the border-style problem entirely. -->
      <div
        v-for="minute in HOUR_MARKS"
        :key="`hour-${minute}`"
        class="tw-absolute tw-inset-x-0 tw-h-px tw-bg-neutral-200"
        :style="{ top: topOf(minute) }"
      />
      <!-- Fainter than the hour lines, so they help read a time without
           competing with them. -->
      <div
        v-for="minute in HALF_HOUR_MARKS"
        :key="`half-${minute}`"
        class="tw-absolute tw-inset-x-0 tw-h-px tw-bg-neutral-100"
        :style="{ top: topOf(minute) }"
      />

      <MeetingBlock
        v-for="meeting in meetings"
        :key="meeting.id"
        :data-meeting-id="meeting.id"
        :startMinute="meeting.startMinute"
        :endMinute="meeting.endMinute"
        :isDragging="meeting.id === draggingId"
      />

      <MeetingBlock
        v-if="draft"
        :startMinute="draft.startMinute"
        :endMinute="draft.endMinute"
        isDraft
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ColumnHeader from "./ColumnHeader.vue";
import MeetingBlock from "./MeetingBlock.vue";
import type { Meeting, TimeRange } from "../types";
import {
  COLUMN_HEIGHT,
  HALF_HOUR_MARKS,
  HOUR_MARKS,
  topOf,
} from "../helpers/timeScale";

defineProps<{
  label: string;
  dayIndex: number;
  meetings: Meeting[];
  /** The meeting being drawn out here, while the pointer is still down. */
  draft: TimeRange | null;
  draggingId: string | null;
}>();
</script>
