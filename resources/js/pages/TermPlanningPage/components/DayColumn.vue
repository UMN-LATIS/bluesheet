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
      :style="{ height: COLUMN_HEIGHT }"
      @pointerdown="startDraft"
      @pointermove="extendDraft"
      @pointerup="commitDraft"
      @pointercancel="draft = null"
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
        :startMinute="meeting.startMinute"
        :endMinute="meeting.endMinute"
        @pointerdown.stop
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
import { ref } from "vue";
import ColumnHeader from "./ColumnHeader.vue";
import MeetingBlock from "./MeetingBlock.vue";
import type { Meeting, TimeRange } from "../types";
import {
  COLUMN_HEIGHT,
  END_MINUTE,
  HALF_HOUR_MARKS,
  HOUR_MARKS,
  SNAP_MINUTES,
  minuteAt,
  snapToGrid,
  topOf,
} from "../helpers/timeScale";

/** What a click with no drag creates: one standard fifty-minute period. */
const CLICK_DURATION = 50;

defineProps<{
  label: string;
  meetings: Meeting[];
}>();

const emit = defineEmits<{ create: [range: TimeRange] }>();

const draft = ref<TimeRange | null>(null);

/** The minute the drag began, which the pointer may now be above or below. */
let anchorMinute = 0;

function minuteFromEvent(event: PointerEvent): number {
  const column = event.currentTarget as HTMLElement;
  const offsetY = event.clientY - column.getBoundingClientRect().top;
  return snapToGrid(minuteAt(offsetY));
}

function startDraft(event: PointerEvent) {
  if (event.button !== 0) return;

  // Capture so the drag keeps reporting once the pointer leaves the column,
  // which it will the moment someone drags past the last hour.
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

  anchorMinute = minuteFromEvent(event);
  draft.value = { startMinute: anchorMinute, endMinute: anchorMinute };
}

function extendDraft(event: PointerEvent) {
  if (!draft.value) return;

  const reached = minuteFromEvent(event);
  draft.value = {
    startMinute: Math.min(anchorMinute, reached),
    endMinute: Math.max(anchorMinute, reached),
  };
}

function commitDraft() {
  if (!draft.value) return;

  const { startMinute, endMinute } = draft.value;
  draft.value = null;

  // Too short to be a drag, so read it as a click and give it a full period.
  const range =
    endMinute - startMinute < SNAP_MINUTES
      ? {
          startMinute,
          endMinute: Math.min(startMinute + CLICK_DURATION, END_MINUTE),
        }
      : { startMinute, endMinute };

  if (range.endMinute > range.startMinute) emit("create", range);
}
</script>
