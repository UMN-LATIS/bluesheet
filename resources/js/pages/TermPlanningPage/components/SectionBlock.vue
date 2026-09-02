<template>
  <div class="tw-relative tw-overflow-hidden tw-leading-tight">
    <span
      v-if="isEdited"
      class="tw-absolute tw-right-0 tw-top-0.5 tw-h-2 tw-w-2 tw-rounded-full tw-bg-accent tw-ring-1 tw-ring-inset tw-ring-black/20"
      title="Edited here, not saved anywhere"
    />
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

const props = defineProps<{
  section: SisSection;
  width: number;
  /** As drawn on the grid, which may differ from the section's saved times. */
  startMinute: number;
  endMinute: number;
  isEdited?: boolean;
}>();

/**
 * At or above this lane width there is room
 * for the meeting type beside the instructor.
 */
const WIDE_LANE_WIDTH = 120;

const isWide = computed(() => props.width >= WIDE_LANE_WIDTH);

const heading = computed(
  () =>
    `${props.section.subject} ${props.section.catalogNumber} · ${props.section.section}`,
);

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

/** Below this many minutes tall, the times are dropped. */
const THREE_LINE_MINUTES = 50;

const hasRoomForTimes = computed(
  () => props.endMinute - props.startMinute >= THREE_LINE_MINUTES,
);

const timeRange = computed(() =>
  formatTimeRange(props.startMinute, props.endMinute),
);
</script>
