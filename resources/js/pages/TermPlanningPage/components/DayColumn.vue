<template>
  <!--
    This project disables Tailwind's preflight, so nothing gives elements a
    default border-style or zeroes their border-width. A box that wants one
    edge therefore reads `tw-border-0 tw-border-<side> tw-border-solid`:
    without the zero, the three sides left at their initial `medium` width
    appear as soon as a style is set.
  -->
  <div
    class="tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-neutral-200 last:tw-border-r-0"
    :style="{ width: `${view.layout.width}px` }"
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
        v-for="placed in view.layout.placed"
        :key="placed.meeting.id"
        :data-meeting-id="placed.meeting.id"
        :startMinute="placed.meeting.startMinute"
        :endMinute="placed.meeting.endMinute"
        :left="placed.left"
        :width="placed.width"
        :isActive="placed.meeting.id === view.activeMeetingId"
        :isGhost="placed.meeting.id === view.ghostMeetingId"
      >
        <!-- The width goes with it, since how much a block can say depends
             on how much room the day's busiest hour left it. -->
        <template v-if="$slots.block" #default>
          <slot
            name="block"
            :meeting="placed.meeting"
            :width="placed.width"
            :isActive="placed.meeting.id === view.activeMeetingId"
          />
        </template>
      </MeetingBlock>

      <!-- Spans the day rather than taking a lane: it is not placed until it
           is let go of, and the full width keeps its times readable. -->
      <MeetingBlock
        v-if="view.overlay"
        :startMinute="view.overlay.startMinute"
        :endMinute="view.overlay.endMinute"
        :left="0"
        :width="view.layout.width"
        isDraft
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ColumnHeader from "./ColumnHeader.vue";
import MeetingBlock from "./MeetingBlock.vue";
import type { DayView } from "../useScheduleEditor/selectors";
import {
  COLUMN_HEIGHT,
  HALF_HOUR_MARKS,
  HOUR_MARKS,
  topOf,
} from "../helpers/timeScale";

defineProps<{
  label: string;
  dayIndex: number;
  view: DayView;
}>();
</script>
