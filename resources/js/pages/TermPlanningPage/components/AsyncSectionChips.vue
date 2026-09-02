<!--
  A wrapping list of sections with no meeting time. The week grid's Async
  column and the day view's Async tab both show the same list, so this makes
  no assumptions about the width or height of whatever contains it.
-->
<template>
  <p
    v-if="sections.length === 0"
    class="tw-m-0 tw-text-xs tw-text-on-surface-variant"
  >
    Every section shown has a meeting time.
  </p>

  <ul
    v-else
    class="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-content-start tw-gap-1.5 tw-p-0"
  >
    <li v-for="section in sections" :key="section.id">
      <button
        type="button"
        class="tw-flex tw-cursor-pointer tw-items-center tw-gap-[7px] tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-border-l-[3px] tw-py-[3px] tw-pl-3 tw-pr-[5px] tw-text-[11px] tw-leading-tight tw-text-on-surface hover:tw-border-outline"
        :class="[
          colorOfType(section.component).tint,
          colorOfType(section.component).rail,
          section.id === selectedSectionId &&
            'tw-outline tw-outline-2 tw-outline-offset-0 tw-outline-primary',
          section.isCancelled && 'tw-opacity-60',
        ]"
        :aria-pressed="section.id === selectedSectionId"
        @click="schedule.selectSection(section.id)"
      >
        <span class="tw-whitespace-nowrap tw-font-semibold">
          {{ section.subject }} {{ section.catalogNumber }} ·
          {{ section.section }}
        </span>
        <span
          v-if="initialsOf(section)"
          class="tw-flex tw-h-[19px] tw-w-[19px] tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-text-[9px] tw-font-bold tw-text-on-surface-variant"
          :title="leadInstructorOf(section)?.name ?? undefined"
        >
          {{ initialsOf(section) }}
        </span>
        <!-- The empty ring, not a label, is what a scheduler scans this list for. -->
        <span
          v-else
          class="tw-h-[19px] tw-w-[19px] tw-rounded-full tw-border tw-border-dashed tw-border-outline"
          title="No instructor assigned"
          aria-label="No instructor assigned"
        />
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { colorOfType } from "../constants/meetingTypeColors";
import type { PlannedSection, SisInstructor } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

defineProps<{
  sections: PlannedSection[];
  selectedSectionId: number | null;
  schedule: ScheduleEditor;
}>();

const leadInstructorOf = (section: PlannedSection): SisInstructor | undefined =>
  section.instructors.find(({ role }) => role === "PI") ??
  section.instructors[0];

/** "Ana García" → "AG". A last name alone gives its first letter. */
const initialsOf = (section: PlannedSection): string | null => {
  const instructor = leadInstructorOf(section);
  if (!instructor) return null;

  const words = (instructor.name ?? instructor.lastName ?? "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return null;

  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
};
</script>
