<template>
  <div class="tw-relative tw-overflow-hidden tw-leading-tight">
    <span
      v-if="isEdited"
      class="tw-absolute tw-right-0 tw-top-0.5 tw-h-2 tw-w-2 tw-rounded-full tw-bg-accent tw-ring-1 tw-ring-inset tw-ring-black/20"
      title="Edited here, not saved anywhere"
    />
    <div class="tw-truncate tw-font-semibold">{{ heading }}</div>
    <div class="tw-truncate">
      <span class="component-code">{{ section.component }} </span
      >{{ instructorName }}
    </div>
    <div class="time-range tw-truncate tw-opacity-50">{{ timeRange }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatTimeRange } from "../helpers/timeScale";
import type { SisSection } from "../types";

const props = defineProps<{
  section: SisSection;
  /** As drawn on the grid, which may differ from the section's saved times. */
  startMinute: number;
  endMinute: number;
  isEdited?: boolean;
}>();

const heading = computed(
  () =>
    `${props.section.subject} ${props.section.catalogNumber} · ${props.section.section}`,
);

const leadInstructor = computed(
  () =>
    props.section.instructors.find(({ role }) => role === "PI") ??
    props.section.instructors[0],
);

const instructorName = computed(() => {
  const instructor = leadInstructor.value;
  return instructor?.lastName ?? instructor?.name ?? "TBA";
});

const timeRange = computed(() =>
  formatTimeRange(props.startMinute, props.endMinute),
);
</script>

<style scoped>
/*
 * What the block has room to say, asked of the block rather than measured in
 * script. Its content box runs 19px narrower and 10px shorter than the lane
 * and the class's length in minutes; see MeetingBlock. So the meeting type
 * joins the instructor at a 120px lane, and the times appear on a class of
 * 50 minutes or more.
 */
.component-code,
.time-range {
  display: none;
}

@container meeting-block (min-width: 101px) {
  .component-code {
    display: inline;
  }
}

@container meeting-block (min-height: 40px) {
  .time-range {
    display: block;
  }
}
</style>
