<!--
  What meets in one hour of the heatmap. The heatmap is where a problem is
  found and the week is where it is looked at, so this names the hour, lists
  what fills it, and offers the way across.
-->
<template>
  <aside
    aria-label="Sections in this hour"
    class="tw-flex tw-h-full tw-w-full tw-min-h-0 tw-flex-col tw-bg-surface-bright tw-text-on-surface"
  >
    <div
      class="tw-flex-none tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-px-[18px] tw-pb-3 tw-pt-3.5"
    >
      <div class="tw-flex tw-items-start tw-gap-2.5">
        <div class="tw-min-w-0">
          <h2 class="tw-m-0 tw-text-[19px] tw-font-bold tw-tracking-tight">
            {{ dayName }} · {{ formatTimeRange(startMinute, startMinute + 60) }}
          </h2>
          <p class="tw-m-0 tw-text-[12.5px] tw-text-on-surface-variant">
            {{ entries.length }}
            {{ entries.length === 1 ? "section meets" : "sections meet" }}
            during this hour
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          class="tw-ml-auto tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        class="tw-mt-1.5 tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-1.5 tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-font-semibold tw-text-primary hover:tw-underline"
        @click="emit('showInWeek')"
      >
        Show this hour in Week
        <ArrowRightIcon class="tw-h-3 tw-w-3 tw-flex-none" />
      </button>
    </div>

    <div
      class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-1.5 tw-overflow-y-auto tw-p-3"
    >
      <p
        v-if="entries.length === 0"
        class="tw-m-0 tw-text-[12.5px] tw-text-on-surface-variant"
      >
        Nothing meets in this hour.
      </p>

      <button
        v-for="entry in entries"
        :key="entry.meetingId"
        type="button"
        class="tw-flex tw-min-h-[54px] tw-cursor-pointer tw-items-center tw-gap-2.5 tw-rounded-[10px] tw-border tw-border-l-4 tw-border-solid tw-border-outline-variant tw-px-3 tw-py-2 tw-text-left tw-text-on-surface hover:tw-border-outline"
        :class="[
          colorOfType(entry.section.component).tint,
          colorOfType(entry.section.component).rail,
        ]"
        @click="
          schedule.selectSection(entry.section.id, {
            kind: 'hour',
            dayIndex,
            startMinute,
          })
        "
      >
        <span class="tw-min-w-0 tw-flex-1">
          <span class="tw-block tw-truncate tw-text-[13.5px] tw-font-bold">
            {{ entry.section.subject }} {{ entry.section.catalogNumber }} ·
            {{ entry.section.section }}
          </span>
          <span
            class="tw-block tw-truncate tw-text-[11.5px] tw-text-on-surface-variant"
          >
            {{ entry.section.component }} · {{ instructorOf(entry.section) }}
          </span>
        </span>
        <span class="tw-flex-none tw-text-right">
          <span class="tw-block tw-text-xs">
            {{ formatTimeRange(entry.startMinute, entry.endMinute) }}
          </span>
          <!--
            Over its cap is the one piece of judgement this list can offer:
            21 of 15 and 8 of 15 read alike until one of them is marked.
          -->
          <span
            class="tw-block tw-text-[11.5px] tw-tabular-nums"
            :class="
              isOverCap(entry.section)
                ? 'tw-font-bold tw-text-brand'
                : 'tw-text-on-surface-variant'
            "
            :title="`${entry.section.enrollmentTotal} enrolled of a cap of ${entry.section.enrollmentCap}`"
          >
            {{ entry.section.enrollmentTotal }} /
            {{ entry.section.enrollmentCap
            }}{{ isOverCap(entry.section) ? " over" : "" }}
          </span>
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ArrowRightIcon } from "@/icons";
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

const emit = defineEmits<{ close: []; showInWeek: [] }>();

const isOverCap = (section: SisSection) =>
  section.enrollmentTotal > section.enrollmentCap;

const instructorOf = (section: SisSection) => {
  const lead =
    section.instructors.find(({ role }) => role === "PI") ??
    section.instructors[0];
  return lead?.lastName ?? lead?.name ?? "TBA";
};
</script>
