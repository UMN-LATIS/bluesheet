<template>
  <div class="tw-p-4">
    <!--
      Cells are a fixed width, set on their contents so the table cannot shrink
      them: the sheet opening beside the table must not move the cell that was
      just clicked, or the pointer finds itself over a different one. At 88px
      the five days still fit beside an open sheet on a 1280px screen.
    -->
    <table class="tw-border-separate tw-border-spacing-1 tw-text-sm">
      <thead>
        <tr>
          <th class="tw-w-14"></th>
          <th
            v-for="day in dayNames"
            :key="day"
            scope="col"
            class="tw-pb-1 tw-text-center tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-500"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in coverage.rows" :key="row.startMinute">
          <th
            scope="row"
            class="tw-pr-2 tw-text-right tw-text-xs tw-font-normal tw-text-neutral-500"
          >
            {{ formatHour(row.startMinute) }}
          </th>
          <td
            v-for="(count, dayIndex) in row.counts"
            :key="dayIndex"
            class="tw-h-11 tw-p-0"
          >
            <!-- A busy cell opens the list of sections behind its number. -->
            <button
              v-if="count > 0"
              type="button"
              class="heat-cell tw-h-full tw-w-[88px] tw-cursor-pointer tw-rounded tw-border-none tw-text-center tw-text-sm tw-font-medium tw-tabular-nums"
              :class="{
                'heat-cell--selected': isSelected(dayIndex, row.startMinute),
              }"
              :style="cellStyle(count)"
              :aria-pressed="isSelected(dayIndex, row.startMinute)"
              :title="`${dayNames[dayIndex]} ${formatHour(row.startMinute)}: ${count} at once`"
              @click="schedule.selectHour(dayIndex, row.startMinute)"
            >
              {{ count }}
            </button>
            <div
              v-else
              class="tw-h-full tw-w-[88px] tw-rounded tw-bg-neutral-100"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { coverageByHour } from "../helpers/hourlyCoverage";
import { formatHour } from "../helpers/timeScale";
import type { Meeting } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

/**
 * The whole term on one screen, for reading coverage rather than editing.
 * Takes the same meetings the week view draws, filters and local edits
 * included, so the two views always agree.
 */
const props = defineProps<{
  meetings: Meeting[];
  dayNames: string[];
  schedule: ScheduleEditor;
}>();

/**
 * The cell stays marked while the user is a level down in one of its
 * sections, so the sheet's back link and the ring point at the same hour.
 */
const isSelected = (dayIndex: number, startMinute: number) => {
  const selection = props.schedule.selection;
  const hour =
    selection?.kind === "hour"
      ? selection
      : selection?.kind === "section"
        ? selection.from
        : undefined;

  return hour?.dayIndex === dayIndex && hour?.startMinute === startMinute;
};

const coverage = computed(() =>
  coverageByHour(props.meetings, props.dayNames.length),
);

/**
 * One hue, the University's maroon, from faint to full against the peak.
 * The floor keeps a count of one visible; text switches to white once the
 * cell is dark enough to need it.
 */
const cellStyle = (count: number) => {
  if (count === 0 || coverage.value.peak === 0) return undefined;

  const alpha = 0.15 + 0.85 * (count / coverage.value.peak);
  return {
    backgroundColor: `rgba(122, 0, 25, ${alpha.toFixed(2)})`,
    color: alpha > 0.5 ? "white" : "rgb(38 38 38)",
  };
};
</script>

<style scoped>
/*
 * Hover and selection are drawn inside the cell, as inset rings with a white
 * gap, so they read on the darkest maroon and never spill into the gutter
 * between cells, where an outline would look like it belonged to the
 * neighbor. The selected ring is the heavier of the two.
 */
.heat-cell:hover,
.heat-cell:focus-visible {
  box-shadow:
    inset 0 0 0 2px white,
    inset 0 0 0 4px rgb(115 115 115);
  outline: none;
}

.heat-cell--selected,
.heat-cell--selected:hover {
  box-shadow:
    inset 0 0 0 2px white,
    inset 0 0 0 5px rgb(23 23 23);
  font-weight: 700;
}
</style>
