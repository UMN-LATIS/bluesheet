<template>
  <!--
    Tailwind preflight is off here, so `tw-border-0` must precede any
    single-side border or the other three sides appear at `medium` width.

    The day rule is `outline` where the hour rules inside the column are
    `outline-variant`: a week is read a day at a time, so the line that ends
    a day has to carry more than the lines that divide it up.
  -->
  <div
    class="tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-outline last:tw-border-r-0"
    :style="{ width: `${view.layout.width}px` }"
  >
    <ColumnHeader>
      <!--
        Sticky at both edges, so a wide column
        keeps its name in view while scrolling.
      -->
      <span
        class="tw-sticky tw-flex tw-items-baseline tw-gap-2"
        :style="{
          left: 'calc(var(--day-label-offset, 0px) + 0.5rem)',
          right: '0.5rem',
        }"
      >
        <span
          class="tw-text-[12.5px] tw-font-bold tw-uppercase tw-tracking-[0.04em] tw-text-on-surface"
        >
          {{ label }}
        </span>
        <span class="tw-text-[11px] tw-text-on-surface-variant">
          {{ view.layout.placed.length }}
          {{ view.layout.placed.length === 1 ? "class" : "classes" }}
        </span>
      </span>
    </ColumnHeader>
    <div
      class="tw-relative tw-select-none"
      :data-day-index="dayIndex"
      :style="{ height: COLUMN_HEIGHT }"
    >
      <div
        v-for="minute in HOUR_MARKS"
        :key="`hour-${minute}`"
        class="tw-absolute tw-inset-x-0 tw-h-px tw-bg-outline-variant"
        :style="{ top: topOf(minute) }"
      />
      <div
        v-for="minute in HALF_HOUR_MARKS"
        :key="`half-${minute}`"
        class="tw-absolute tw-inset-x-0 tw-h-px tw-bg-surface-container"
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
        :isJustPlaced="placed.meeting.id === view.justPlacedMeetingId"
        :isSelected="placed.meeting.id === view.selectedMeetingId"
        :isReadOnly="isReadOnly"
        :component="componentOf?.(placed.meeting)"
        :isUnofficial="isUnofficial?.(placed.meeting)"
      >
        <template v-if="$slots.block" #default>
          <slot
            name="block"
            :meeting="placed.meeting"
            :width="placed.width"
            :isActive="placed.meeting.id === view.activeMeetingId"
          />
        </template>
      </MeetingBlock>

      <!-- the in-flight block spans the day; it has no lane until released -->
      <MeetingBlock
        v-if="view.overlay"
        :startMinute="view.overlay.startMinute"
        :endMinute="view.overlay.endMinute"
        :left="0"
        :width="view.layout.width"
        :isDraft="!carriedMeeting"
        :isCarried="Boolean(carriedMeeting)"
        :component="carriedMeeting ? componentOf?.(carriedMeeting) : undefined"
        :isUnofficial="carriedMeeting ? isUnofficial?.(carriedMeeting) : false"
      >
        <template v-if="$slots.block && carriedMeeting" #default>
          <slot
            name="block"
            :meeting="carriedMeeting"
            :width="view.layout.width"
            :isActive="false"
          />
        </template>
      </MeetingBlock>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ColumnHeader from "./ColumnHeader.vue";
import MeetingBlock from "./MeetingBlock.vue";
import type { Meeting } from "../types";
import type { DayView } from "../useScheduleEditor/selectors";
import {
  COLUMN_HEIGHT,
  HALF_HOUR_MARKS,
  HOUR_MARKS,
  topOf,
} from "../helpers/timeScale";

const props = defineProps<{
  label: string;
  dayIndex: number;
  view: DayView;
  /**
   * SIS component code (LEC, DIS, …) of the
   * meeting's class, which picks the block color.
   */
  componentOf?: (meeting: Meeting) => string | undefined;
  isUnofficial?: (meeting: Meeting) => boolean;
  /** Draws the blocks without their handles; see `MeetingBlock`. */
  isReadOnly?: boolean;
}>();

/** The meeting the pointer is carrying, at the time it now hovers over. */
const carriedMeeting = computed<Meeting | null>(() => {
  const { overlay } = props.view;
  if (!overlay?.meetingId) return null;

  return {
    id: overlay.meetingId,
    dayIndex: props.dayIndex,
    startMinute: overlay.startMinute,
    endMinute: overlay.endMinute,
    sectionId: overlay.sectionId,
  };
});
</script>
