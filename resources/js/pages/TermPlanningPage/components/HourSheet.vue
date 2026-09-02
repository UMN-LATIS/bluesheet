<template>
  <aside
    aria-label="Sections in this hour"
    class="tw-min-h-0 tw-overflow-y-auto tw-bg-surface-bright tw-p-4 tw-text-on-surface"
  >
    <div class="tw-mb-4 tw-flex tw-items-start tw-justify-between tw-gap-2">
      <div>
        <p class="tw-m-0 tw-text-xs tw-text-on-surface-variant">
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
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-on-surface-variant"
        @click="emit('close')"
      >
        ×
      </button>
    </div>

    <p
      v-if="entries.length === 0"
      class="tw-m-0 tw-text-sm tw-text-on-surface-variant"
    >
      Nothing meets in this hour.
    </p>

    <ul
      v-else
      class="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-1.5 tw-p-0"
    >
      <li v-for="entry in entries" :key="entry.meetingId">
        <button
          type="button"
          class="tw-flex tw-w-full tw-cursor-pointer tw-items-baseline tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-px-2.5 tw-py-1.5 tw-text-left tw-text-xs tw-text-on-surface hover:tw-border-outline"
          :class="colorOfType(entry.section.component).block"
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
            <span class="tw-block tw-truncate tw-text-on-surface-variant">
              {{ entry.section.component }} · {{ instructorOf(entry.section) }}
            </span>
          </span>
          <span class="tw-flex-none tw-text-right tw-text-on-surface-variant">
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
import { colorOfType } from "../constants/meetingTypeColors";
import { formatTimeRange } from "../helpers/timeScale";
import type { SisSection, TimeRange } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

/**
 * A section's meeting that falls in the
 * chosen hour, at the time the grid shows it.
 */
export interface HourEntry extends TimeRange {
  meetingId: string;
  section: SisSection;
}

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
