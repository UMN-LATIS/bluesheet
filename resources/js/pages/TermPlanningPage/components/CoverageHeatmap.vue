<template>
  <div class="tw-p-6">
    <h2 class="tw-m-0 tw-text-base tw-font-semibold tw-text-neutral-900">
      Coverage by hour
    </h2>
    <p class="tw-m-0 tw-mb-4 tw-text-sm tw-text-neutral-500">
      Most meetings running at once in each hour.
      <template v-if="coverage.peak > 0">
        Darker is busier; the peak is {{ coverage.peak }}.
      </template>
      <template v-else>Nothing is scheduled.</template>
    </p>

    <table class="tw-w-full tw-border-separate tw-border-spacing-1 tw-text-sm">
      <thead>
        <tr>
          <th class="tw-w-16"></th>
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
            class="tw-h-11 tw-rounded tw-text-center tw-tabular-nums"
            :class="count > 0 ? 'tw-font-medium' : 'tw-bg-neutral-100'"
            :style="cellStyle(count)"
            :title="`${dayNames[dayIndex]} ${formatHour(row.startMinute)}: ${count} at once`"
          >
            <template v-if="count > 0">{{ count }}</template>
          </td>
        </tr>
      </tbody>
    </table>

    <p
      class="tw-mb-0 tw-mt-6 tw-border-0 tw-border-t tw-border-solid tw-border-neutral-200 tw-pt-4 tw-text-sm tw-text-neutral-600"
    >
      Each cell is the largest number of meetings running at the same moment in
      that hour. It is the same measure that sets the day column widths on the
      week view, so the peak here is the number behind the widest column there.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { coverageByHour } from "../helpers/hourlyCoverage";
import { formatHour } from "../helpers/timeScale";
import type { Meeting } from "../types";

/**
 * The whole term on one screen, for reading coverage rather than editing.
 * Takes the same meetings the week view draws, filters and local edits
 * included, so the two views always agree.
 */
const props = defineProps<{
  meetings: Meeting[];
  dayNames: string[];
}>();

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
