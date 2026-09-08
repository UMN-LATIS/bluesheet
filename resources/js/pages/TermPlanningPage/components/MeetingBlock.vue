<template>
  <div
    class="meeting-block tw-absolute tw-box-border tw-rounded-lg tw-border-0 tw-border-l-[3px] tw-border-solid tw-px-2 tw-py-[5px] tw-text-[11px] tw-leading-[1.3] tw-text-on-surface"
    :class="[appearance, { 'just-placed': isJustPlaced }]"
    :style="{
      top: topOf(startMinute),
      height: heightOf(startMinute, endMinute),
      left: `${left}px`,
      width: `${width}px`,
    }"
  >
    <!--
      overflow is clipped here, not on the block,
      so the grips can reach past its edges
    -->
    <div
      class="tw-flex tw-h-full tw-flex-col tw-justify-between tw-overflow-hidden tw-whitespace-nowrap"
    >
      <slot>
        <MeetingTimes :startMinute="startMinute" :endMinute="endMinute" />
      </slot>
    </div>

    <!--
      Grips straddle each edge, half outside the block, so a slightly wide aim
      still catches it.
    -->
    <template v-if="!isDraft && !isReadOnly">
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
import { colorOfType } from "../constants/meetingTypeColors";
import { heightOf, topOf } from "../helpers/timeScale";

const props = defineProps<{
  startMinute: number;
  endMinute: number;
  left: number;
  width: number;
  /** A block being drawn out, before any meeting exists for it. */
  isDraft?: boolean;
  /** While one of its edges is being dragged by the pointer. */
  isActive?: boolean;
  /** Left in place, faded, while the pointer carries its meeting elsewhere. */
  isGhost?: boolean;
  isCarried?: boolean;
  isJustPlaced?: boolean;
  isSelected?: boolean;
  /** A block on a term nobody can edit: no grips, and it opens the sheet. */
  isReadOnly?: boolean;
  /** The SIS component code of the class on it; absent on a block with none. */
  component?: string;
  isUnofficial?: boolean;
}>();

const appearance = computed(() => {
  if (props.isDraft) {
    return "tw-border-dashed tw-border-brand tw-bg-brand-container tw-text-brand";
  }

  const type = colorOfType(props.component);
  // A dashed edge rather than a color of its own: the block keeps saying what
  // component it is, and the same dashes mark the Async column and the draft.
  const edge = props.isUnofficial ? "tw-border-dashed" : "";
  const toned = `${type.tint} ${type.rail} ${edge}`;
  // Blue rather than the block's own color: the ring means "the sheet is
  // open on this one", which is what blue means everywhere else in the app.
  // On a read-only term it falls back to ink, since nothing there can be
  // acted on and blue would be the only thing claiming otherwise. An
  // outline, so the box size holds still.
  const ring = props.isReadOnly
    ? "tw-outline-on-surface tw-shadow-[0_4px_12px_rgba(38,38,38,0.14)]"
    : "tw-outline-primary tw-shadow-[0_4px_12px_rgba(29,104,167,0.18)]";

  const solid = props.isSelected
    ? `${toned} tw-z-[5] tw-outline tw-outline-2 tw-outline-offset-0 ${ring}`
    : toned;

  if (props.isReadOnly) return `${solid} tw-cursor-pointer`;

  if (props.isGhost) return `${solid} tw-opacity-40`;

  if (props.isCarried) {
    return `${solid} tw-z-20 tw-cursor-grabbing tw-opacity-70 tw-shadow-lg`;
  }

  return props.isActive
    ? `${solid} tw-z-20 tw-cursor-grabbing tw-shadow-lg`
    : `${solid} tw-cursor-grab`;
});
</script>

<style scoped>
/*
 * The block is what its contents measure themselves against, so a short class
 * can drop a line without anyone passing its size down in props. One minute
 * is one pixel here, so a height query is a query on how long the class runs;
 * what a query sees is the padded content box, 10px shorter and 19px narrower
 * than the block. Children ask for it by name with `@container meeting-block`.
 */
.meeting-block {
  container: meeting-block / size;
}

.just-placed {
  animation: just-placed 600ms ease-out;
}

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
