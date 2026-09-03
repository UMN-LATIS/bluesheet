<!-- The row of day tabs the day view reads through. Async sits last and is
     marked off from the weekdays by a dashed edge rather than a name alone,
     since "no set time" is a different kind of day than a weekday with zero
     classes on it. -->
<template>
  <div
    role="tablist"
    aria-label="Day"
    class="tw-flex tw-flex-none tw-items-stretch tw-border-0 tw-border-b tw-border-solid tw-border-surface-container"
    :class="{ 'scrollbar-always-visible tw-overflow-x-auto': size !== 'large' }"
  >
    <button
      v-for="(name, index) in DAY_TAB_NAMES"
      :key="name"
      type="button"
      role="tab"
      :aria-selected="index === dayIndex"
      class="tw-flex tw-flex-1 tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-px tw-border-0 tw-border-b-[3px] tw-border-solid tw-bg-transparent hover:tw-bg-surface"
      :class="[
        // `min-w-0` is what lets six tabs share a narrow column: a flex item
        // defaults to `min-width: auto` and would otherwise refuse to shrink
        // below its own label, pushing Async off the end. Where the row
        // scrolls instead, a floor keeps the tabs thumb-sized.
        size === 'large'
          ? 'tw-min-h-[52px] tw-min-w-0'
          : 'tw-min-w-24 tw-min-h-14',
        index === dayIndex ? 'tw-border-b-brand' : 'tw-border-b-transparent',
        isAsyncDay(index) &&
          'async-tab tw-border-l tw-border-l-outline-variant',
      ]"
      @click="emit('select', index)"
    >
      <span
        class="tw-text-[13px] tw-font-bold tw-uppercase tw-tracking-[0.04em]"
        :class="
          index === dayIndex
            ? 'tw-text-on-surface'
            : 'tw-text-on-surface-variant'
        "
      >
        {{ name }}
      </span>
      <span class="tw-text-[11px] tw-text-on-surface-variant">
        {{ countLabel(index) }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { DAY_TAB_NAMES, isAsyncDay } from "../helpers/scheduleDays";
import type { ScreenSize } from "../useScreenSize";

const props = defineProps<{
  dayIndex: number;
  counts: number[];
  size: ScreenSize;
}>();

const emit = defineEmits<{ select: [dayIndex: number] }>();

/**
 * Always the noun, never a bare number: "MON 14" reads as Monday the 14th.
 * Async counts sections rather than classes, as the summary strip under the
 * tabs does, since what it holds are the classes with no day at all.
 */
const countLabel = (index: number): string => {
  const count = props.counts[index] ?? 0;

  return isAsyncDay(index)
    ? `${count} ${count === 1 ? "section" : "sections"}`
    : `${count} ${count === 1 ? "class" : "classes"}`;
};
</script>

<style scoped>
/* Async is marked off from the weekdays by a dashed
   edge, where the tab's other borders are solid. */
.async-tab {
  border-left-style: dashed;
}
</style>
