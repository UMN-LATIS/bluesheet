<template>
  <div
    class="tw-absolute tw-box-border tw-rounded tw-border tw-border-solid tw-px-1.5 tw-py-1 tw-text-[11px] tw-leading-tight"
    :class="appearance"
    :style="{
      top: topOf(startMinute),
      height: heightOf(startMinute, endMinute),
      left: `${left}px`,
      width: `${width}px`,
    }"
  >
    <!--
      Clipping happens here rather than on the block, so the grips below can
      reach past its edges.

      The two times sit at the top and bottom, as they do beside the standard
      periods, so where each is printed matches the moment it names. Stacking
      them also keeps the end time legible at a day's narrowest lane, where a
      single line of "10:00 – 11:45" would be cut off after the start.
    -->
    <div
      class="tw-flex tw-h-full tw-flex-col tw-justify-between tw-overflow-hidden tw-whitespace-nowrap"
    >
      <!-- What a block says is the caller's business; where it sits is this
           component's. Its own times are what a caller with nothing to say
           gets. -->
      <slot>
        <MeetingTimes :startMinute="startMinute" :endMinute="endMinute" />
      </slot>
    </div>

    <!--
      Grips for lengthening the meeting. Each straddles its edge — half over
      the block, half over the column outside it — so aiming a little wide
      still catches the edge instead of drawing a new meeting underneath.
      The 8px over 4px geometry follows FullCalendar's time grid.
    -->
    <template v-if="!isDraft">
      <div
        v-for="edge in ['start', 'end']"
        :key="edge"
        :data-resize-edge="edge"
        class="tw-absolute tw-inset-x-0 tw-z-10 tw-h-2 tw-cursor-ns-resize"
        :class="edge === 'start' ? '-tw-top-1' : '-tw-bottom-1'"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import MeetingTimes from "./MeetingTimes.vue";
import { heightOf, topOf } from "../helpers/timeScale";

const props = defineProps<{
  startMinute: number;
  endMinute: number;
  /** Its lane within the day, in pixels from the column's left edge. */
  left: number;
  width: number;
  /** An uncommitted block: one being drawn out, or one the pointer carries. */
  isDraft?: boolean;
  /** While one of its edges is being dragged by the pointer. */
  isActive?: boolean;
  /** Left in place, faded, while the pointer carries its meeting elsewhere. */
  isGhost?: boolean;
}>();

const appearance = computed(() => {
  if (props.isDraft) {
    return "tw-border-dashed tw-border-umn-maroon tw-bg-umn-maroon/10 tw-text-umn-maroon";
  }

  const solid = "tw-border-blue-500 tw-bg-blue-100 tw-text-blue-900";

  if (props.isGhost) return `${solid} tw-opacity-40`;

  // Lifted above its neighbours while resized, so it is never hidden behind
  // one it grows to overlap.
  return props.isActive
    ? `${solid} tw-z-20 tw-cursor-grabbing tw-shadow-lg`
    : `${solid} tw-cursor-grab`;
});
</script>
