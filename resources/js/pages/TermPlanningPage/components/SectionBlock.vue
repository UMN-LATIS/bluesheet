<template>
  <div class="tw-relative tw-overflow-hidden tw-leading-tight">
    <span
      v-if="isEdited"
      class="tw-absolute tw-right-0 tw-top-0.5 tw-h-2 tw-w-2 tw-rounded-full tw-bg-accent tw-ring-1 tw-ring-inset tw-ring-black/20"
      title="Edited here, not saved anywhere"
    />
    <div class="tw-truncate tw-font-semibold">
      {{ heading }}
      <span v-if="isUnofficial" title="Named here, not published by the SIS">
        *
      </span>
    </div>
    <div class="tw-truncate">
      <span class="component-code tw-me-1">{{ section.component }}</span
      >{{ instructorName }}
    </div>
    <div v-if="assistants" class="assistants tw-truncate tw-opacity-70">
      TA {{ assistants }}
    </div>
    <div class="time-range tw-truncate tw-opacity-50">{{ timeRange }}</div>
    <NoteIcon
      v-if="hasNote"
      class="tw-absolute tw-bottom-0 tw-right-0 tw-h-3 tw-w-3 tw-opacity-60"
      aria-label="Has a note"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NoteIcon } from "@/icons";
import { assistantNames, leadInstructorName } from "../helpers/sectionPeople";
import { formatTimeRange } from "../helpers/timeScale";
import type { PlannedSection } from "../types";

const props = defineProps<{
  section: PlannedSection;
  /** As drawn on the grid, which may differ from the section's saved times. */
  startMinute: number;
  endMinute: number;
  isEdited?: boolean;
  isUnofficial?: boolean;
}>();

const hasNote = computed(() => props.section.notes.trim() !== "");

const instructorName = computed(() =>
  leadInstructorName(props.section.instructors),
);

const assistants = computed(() => assistantNames(props.section.instructors));

const heading = computed(
  () =>
    `${props.section.subject} ${props.section.catalogNumber} · ${props.section.section}`,
);

const timeRange = computed(() =>
  formatTimeRange(props.startMinute, props.endMinute),
);
</script>

<style scoped>
/*
 * What the block has room to say, asked of the block rather than measured in
 * script. Its content box runs 19px narrower and 10px shorter than the lane
 * and the class's length in minutes; see MeetingBlock. So the meeting type
 * joins the instructor at a 120px lane, the times appear on a class of 50
 * minutes or more, and the assistants, a fourth line at 14.3px each, need a
 * class of 70 minutes to sit under the three above them.
 */
.component-code,
.assistants,
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

@container meeting-block (min-height: 60px) {
  .assistants {
    display: block;
  }
}
</style>
