<template>
  <div class="tw-p-4">
    <!--
      Fixed cell width, so the sheet opening beside the table does not shift
      the cell that was just clicked out from under the pointer.
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

const props = defineProps<{
  meetings: Meeting[];
  dayNames: string[];
  schedule: ScheduleEditor;
}>();

// still marked while a section picked from this hour is open
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

// the alpha floor keeps a count of one visible; text goes white on dark cells
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
 * inset rings, so they show on the darkest
 * cells and never bleed into the gutter
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
