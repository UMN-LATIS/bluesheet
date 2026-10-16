<!--
  The sections with no meeting time. The week grid's Async
  column and the day view's Async tab both show the same
  list, so this makes no assumptions about the width or
  height of whatever contains it: the column asks for three
  to a row, and the tab, which is as wide as the canvas,
  lets them wrap.
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
    class="tw-m-0 tw-list-none tw-gap-1.5 tw-p-0"
    :class="
      layout === 'columns'
        ? 'tw-grid tw-grid-cols-3'
        : 'tw-flex tw-flex-wrap tw-content-start'
    "
  >
    <li v-for="section in sections" :key="section.id" class="tw-min-w-0">
      <SectionChip
        class="tw-w-full"
        :label="`${section.subject} ${section.catalogNumber} · ${section.section}`"
        :component="section.component"
        :isSelected="section.id === selectedSectionId"
        :isCancelled="section.isCancelled"
        :isUnofficial="props.unofficialCourseCodes.has(section.courseCode)"
        :isReadOnly="schedule.isReadOnly"
        @click="
          schedule.dispatch({ type: 'selectedSection', sectionId: section.id })
        "
      >
        <NoteIcon
          v-if="section.notes.trim() !== ''"
          class="tw-h-3 tw-w-3 tw-flex-none tw-text-on-surface-variant"
          aria-label="Has a note"
        />
        <span
          v-if="initialsOf(section)"
          class="tw-flex tw-h-[19px] tw-w-[19px] tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-text-[9px] tw-font-bold tw-text-on-surface-variant"
          :title="leadInstructorOf(section)?.name ?? undefined"
        >
          {{ initialsOf(section) }}
        </span>
        <!--
          The empty ring, not a label, is what a scheduler
          scans this list for.
        -->
        <span
          v-else
          class="tw-h-[19px] tw-w-[19px] tw-rounded-full tw-border tw-border-dashed tw-border-outline"
          title="No instructor assigned"
          aria-label="No instructor assigned"
        />
      </SectionChip>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { NoteIcon } from "@/icons";
import SectionChip from "./SectionChip.vue";
import { instructorsOfRecord } from "../helpers/sectionPeople";
import type { PlannedSection, SisInstructor } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

const props = withDefaults(
  defineProps<{
    sections: PlannedSection[];
    selectedSectionId: number | null;
    schedule: ScheduleEditor;
    unofficialCourseCodes: Set<string>;
    /**
     * "columns" fits three to a row, whatever the codes on
     * them run to.
     */
    layout?: "wrap" | "columns";
  }>(),
  { layout: "wrap" },
);

const leadInstructorOf = (section: PlannedSection): SisInstructor | undefined =>
  instructorsOfRecord(section.instructors)[0];

/**
 * "Ana García" → "AG". A last name alone gives its first
 * letter.
 */
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
