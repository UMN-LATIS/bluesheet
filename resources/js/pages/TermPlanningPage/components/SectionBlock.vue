<template>
  <div class="tw-overflow-hidden tw-leading-tight">
    <div class="tw-truncate tw-font-semibold">{{ heading }}</div>
    <div class="tw-truncate">{{ byline }}</div>
    <div v-if="hasRoomForTimes" class="tw-truncate tw-opacity-50">
      {{ timeRange }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatTimeRange } from "../helpers/timeScale";
import type { SisSection } from "../types";

/**
 * What one section's block says. Where it sits, and how it responds to the
 * pointer, stay `MeetingBlock`'s business.
 */
const props = defineProps<{
  section: SisSection;
  /** The lane width the day's packing left this block, in pixels. */
  width: number;
  /**
   * When the block meets, as the grid has it rather than as the section
   * stores it, so a block dragged to a new time prints the time it now
   * shows at.
   */
  startMinute: number;
  endMinute: number;
}>();

/**
 * Two lanes of a day's base width. At or above it a block has room to name
 * the kind of meeting it is as well as who teaches it; below, the lane goes
 * to the instructor's name, which is the longer of the two.
 */
const WIDE_LANE_WIDTH = 120;

const isWide = computed(() => props.width >= WIDE_LANE_WIDTH);

/**
 * Both halves of what a scheduler calls a class: "3005W · 001". Two
 * sections of one course sit side by side in the same hour, so the catalog
 * number alone does not say which block is which.
 */
const heading = computed(
  () =>
    `${props.section.subject} ${props.section.catalogNumber} · ${props.section.section}`,
);

/** The principal instructor: the one a scheduler scans the grid for. */
const leadInstructor = computed(
  () =>
    props.section.instructors.find(({ role }) => role === "PI") ??
    props.section.instructors[0],
);

const byline = computed(() => {
  const instructor = leadInstructor.value;
  const name = instructor?.lastName ?? instructor?.name ?? "TBA";

  return isWide.value ? `${props.section.component} ${name}` : name;
});

/**
 * Three stacked lines and the block's padding need about this much height.
 * A shorter meeting keeps its identity and drops its times, which its place
 * on the grid gives anyway.
 */
const THREE_LINE_MINUTES = 50;

const hasRoomForTimes = computed(
  () => props.endMinute - props.startMinute >= THREE_LINE_MINUTES,
);

const timeRange = computed(() =>
  formatTimeRange(props.startMinute, props.endMinute),
);
</script>
