<template>
  <aside
    aria-label="Sections in this hour"
    class="tw-min-h-0 tw-overflow-y-auto tw-bg-white tw-p-4"
  >
    <div class="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-2">
      <div>
        <p class="tw-m-0 tw-text-xs tw-text-neutral-500">
          {{ entries.length }}
          {{ entries.length === 1 ? "section meets" : "sections meet" }}
        </p>
        <h2 class="tw-m-0 tw-text-base tw-font-bold">
          {{ dayName }} · {{ formatTimeRange(startMinute, startMinute + 60) }}
        </h2>
      </div>
      <button
        type="button"
        aria-label="Close"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-neutral-500"
        @click="emit('close')"
      >
        ×
      </button>
    </div>

    <p
      v-if="entries.length === 0"
      class="tw-m-0 tw-text-sm tw-text-neutral-500"
    >
      Nothing meets in this hour.
    </p>

    <!-- Each row opens the section's own sheet, in place of this one. -->
    <ul
      v-else
      class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0"
    >
      <li v-for="entry in entries" :key="entry.meetingId">
        <button
          type="button"
          class="tw-flex tw-w-full tw-cursor-pointer tw-items-baseline tw-justify-between tw-gap-3 tw-rounded-sm tw-border tw-border-solid tw-border-neutral-200 tw-px-2.5 tw-py-1.5 tw-text-left tw-text-xs tw-text-neutral-800 hover:tw-border-neutral-400"
          :class="colourOfType(entry.section.component).block"
          @click="
            schedule.selectSection(entry.section.id, {
              kind: 'hour',
              dayIndex,
              startMinute,
            })
          "
        >
          <span class="tw-min-w-0">
            <span class="tw-block tw-font-semibold">
              {{ entry.section.subject }} {{ entry.section.catalogNumber }} ·
              {{ entry.section.section }}
            </span>
            <span class="tw-block tw-truncate tw-text-neutral-600">
              {{ entry.section.component }} · {{ instructorOf(entry.section) }}
            </span>
          </span>
          <span class="tw-flex-none tw-text-right tw-text-neutral-500">
            <span class="tw-block">
              {{ formatTimeRange(entry.startMinute, entry.endMinute) }}
            </span>
            <span
              class="tw-block tw-tabular-nums"
              :title="`${entry.section.enrollmentTotal} enrolled of a cap of ${entry.section.enrollmentCap}`"
            >
              {{ entry.section.enrollmentTotal }} /
              {{ entry.section.enrollmentCap }}
            </span>
          </span>
        </button>
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
import { colourOfType } from "../constants/meetingTypeColours";
import { formatTimeRange } from "../helpers/timeScale";
import type { SisSection, TimeRange } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

/** A section's meeting that falls in the chosen hour, at the time the grid shows it. */
export interface HourEntry extends TimeRange {
  meetingId: string;
  section: SisSection;
}

/**
 * What a heatmap cell stands for: the sections meeting in one hour of one
 * day. Read-only, like the section sheet; it answers "who is that 5?".
 */
defineProps<{
  dayIndex: number;
  dayName: string;
  startMinute: number;
  entries: HourEntry[];
  schedule: ScheduleEditor;
}>();

const emit = defineEmits<{ close: [] }>();

const instructorOf = (section: SisSection) => {
  const lead =
    section.instructors.find(({ role }) => role === "PI") ??
    section.instructors[0];
  return lead?.lastName ?? lead?.name ?? "TBA";
};
</script>
