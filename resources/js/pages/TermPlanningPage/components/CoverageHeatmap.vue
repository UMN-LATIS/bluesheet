<template>
  <div class="tw-p-4">
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
            class="tw-h-11 tw-p-0"
          >
            <!-- A busy cell opens the list of sections behind its number. -->
            <button
              v-if="count > 0"
              type="button"
              class="tw-h-full tw-w-full tw-cursor-pointer tw-rounded tw-border-none tw-text-center tw-text-sm tw-font-medium tw-tabular-nums hover:tw-brightness-95"
              :class="{
                'tw-outline tw-outline-2 tw-outline-offset-1 tw-outline-neutral-800':
                  isSelected(dayIndex, row.startMinute),
              }"
              :style="cellStyle(count)"
              :aria-pressed="isSelected(dayIndex, row.startMinute)"
              :title="`${dayNames[dayIndex]} ${formatHour(row.startMinute)}: ${count} at once`"
              @click="
                schedule.dispatch({
                  type: 'selectedHour',
                  dayIndex,
                  startMinute: row.startMinute,
                })
              "
            >
              {{ count }}
            </button>
            <div v-else class="tw-h-full tw-rounded tw-bg-neutral-100" />
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

const isSelected = (dayIndex: number, startMinute: number) => {
  const { selection } = props.schedule.state.value;
  return (
    selection?.kind === "hour" &&
    selection.dayIndex === dayIndex &&
    selection.startMinute === startMinute
  );
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
