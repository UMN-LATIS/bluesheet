<template>
  <div
    class="tw-absolute tw-box-border tw-rounded-md tw-border tw-border-solid tw-border-outline-variant tw-px-1.5 tw-py-1 tw-text-[11px] tw-leading-tight tw-text-on-surface"
    :class="[appearance, { 'just-placed': isJustPlaced }]"
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
import { colourOfType } from "../constants/meetingTypeColours";
import { heightOf, topOf } from "../helpers/timeScale";

const props = defineProps<{
  startMinute: number;
  endMinute: number;
  /** Its lane within the day, in pixels from the column's left edge. */
  left: number;
  width: number;
  /** A block being drawn out, before any meeting exists for it. */
  isDraft?: boolean;
  /** While one of its edges is being dragged by the pointer. */
  isActive?: boolean;
  /** Left in place, faded, while the pointer carries its meeting elsewhere. */
  isGhost?: boolean;
  /** The copy under the pointer during a move, drawn where it would land. */
  isCarried?: boolean;
  /** Just placed by a gesture, and flashing once to show where it landed. */
  isJustPlaced?: boolean;
  /** The block the user clicked, whose detail sheet is open. */
  isSelected?: boolean;
  /** The SIS component code of the class on it; absent on a block with none. */
  component?: string;
}>();

const appearance = computed(() => {
  if (props.isDraft) {
    return "tw-border-dashed tw-border-brand tw-bg-brand/10 tw-text-brand";
  }

  const toned = colourOfType(props.component).block;
  // An outline rather than a border or shadow, so the block's box size
  // holds still and the ring does not compete with the just-placed flash.
  const solid = props.isSelected
    ? `${toned} tw-outline tw-outline-2 tw-outline-offset-1`
    : toned;

  if (props.isGhost) return `${solid} tw-opacity-40`;

  // Faded, since it is not placed until it is let go of, but still above its
  // neighbours so the block being positioned is never behind one it crosses.
  if (props.isCarried) {
    return `${solid} tw-z-20 tw-cursor-grabbing tw-opacity-70 tw-shadow-lg`;
  }

  // Lifted above its neighbours while resized, so it is never hidden behind
  // one it grows to overlap.
  return props.isActive
    ? `${solid} tw-z-20 tw-cursor-grabbing tw-shadow-lg`
    : `${solid} tw-cursor-grab`;
});
</script>

<style scoped>
/*
 * A dropped block is often one of many that look alike, so it says where it
 * landed by brightening and shedding a ring once.
 */
.just-placed {
  animation: just-placed 600ms ease-out;
}

/* currentColor so the ring matches whichever tone the block is drawn in. */
@keyframes just-placed {
  from {
    box-shadow: 0 0 0 3px currentColor;
  }
  to {
    box-shadow: 0 0 0 7px transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .just-placed {
    animation: none;
  }
}
</style>
