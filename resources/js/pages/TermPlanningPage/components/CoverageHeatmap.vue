<!--
  Where a term is too full and where it is empty, read across a week of hours.
  The grid stretches to whatever pane it is given: the shape of the busy block
  is the point, and it has to be legible from across a desk.

  Colour here is maroon alone. The darkest step is the colour this app uses
  for destruction, which is right for once: dark means busy, and busy is the
  thing a scheduler came to fix.
-->
<template>
  <div class="tw-flex tw-h-full tw-flex-col">
    <div
      ref="gridRef"
      class="tw-flex tw-min-h-0 tw-flex-1 tw-gap-1.5 tw-px-4 tw-pb-1 tw-pt-3.5"
      @keydown="onKeyDown"
    >
      <div class="tw-flex tw-w-14 tw-flex-none tw-flex-col tw-gap-1.5">
        <div class="tw-h-6 tw-flex-none" />
        <div
          v-for="row in coverage.rows"
          :key="row.startMinute"
          class="tw-flex tw-min-h-[30px] tw-flex-1 tw-items-center tw-justify-end tw-pr-2 tw-text-[11.5px] tw-font-semibold tw-tabular-nums tw-text-on-surface-variant"
        >
          {{ formatHour(row.startMinute) }}
        </div>
        <div class="tw-h-[26px] tw-flex-none" />
      </div>

      <div
        v-for="(day, dayIndex) in dayNames"
        :key="day"
        class="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1.5"
      >
        <div
          class="tw-flex tw-h-6 tw-flex-none tw-items-center tw-justify-center tw-text-[12.5px] tw-font-bold tw-uppercase tw-tracking-[0.04em] tw-text-on-surface"
        >
          {{ day }}
        </div>
        <button
          v-for="row in coverage.rows"
          :key="row.startMinute"
          type="button"
          :data-cell="`${dayIndex}-${row.startMinute}`"
          class="heat-cell tw-min-h-[30px] tw-flex-1 tw-cursor-pointer tw-rounded-lg tw-border-none tw-text-[13.5px] tw-font-semibold tw-tabular-nums"
          :class="{
            'heat-cell--selected': isSelected(dayIndex, row.startMinute),
          }"
          :style="cellStyle(row.counts[dayIndex])"
          :aria-pressed="isSelected(dayIndex, row.startMinute)"
          :aria-label="`${day} ${formatHour(row.startMinute)}, ${row.counts[dayIndex]} sections`"
          @click="schedule.selectHour(dayIndex, row.startMinute)"
        >
          {{ row.counts[dayIndex] === 0 ? "" : row.counts[dayIndex] }}
        </button>
        <div
          class="tw-flex tw-h-[26px] tw-flex-none tw-items-center tw-justify-center tw-border-0 tw-border-t tw-border-solid tw-border-surface-container tw-text-xs tw-font-bold tw-tabular-nums"
        >
          {{ coverage.dayTotals[dayIndex] }}
        </div>
      </div>

      <!--
        Outside the colour scale and behind the same dashed rule the week
        uses: what it holds is a count of sections, not a density of hours.
      -->
      <div
        class="tw-ml-1.5 tw-flex tw-w-[88px] tw-flex-none tw-flex-col tw-gap-1.5 tw-border-0 tw-border-l tw-border-dashed tw-border-outline-variant tw-pl-3 cramped:tw-w-[142px]"
      >
        <div
          class="tw-flex tw-h-6 tw-flex-none tw-items-center tw-justify-center tw-text-[12.5px] tw-font-bold tw-tracking-[0.04em] tw-text-on-surface-variant"
        >
          ASYNC
        </div>
        <button
          type="button"
          class="tw-flex tw-flex-1 tw-cursor-pointer tw-flex-col tw-items-center tw-justify-center tw-gap-0.5 tw-rounded-[10px] tw-border tw-border-dashed tw-border-outline tw-bg-surface hover:tw-border-on-surface-variant hover:tw-bg-surface-container"
          :aria-label="`Async, ${asyncCount} sections`"
          @click="emit('showAsync')"
        >
          <span
            class="tw-text-[26px] tw-font-semibold tw-tracking-tight tw-text-on-surface"
          >
            {{ asyncCount }}
          </span>
          <span
            class="tw-text-[10.5px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
          >
            no meeting time
          </span>
        </button>
        <div
          class="tw-h-[26px] tw-flex-none tw-border-0 tw-border-t tw-border-solid tw-border-surface-container"
        />
      </div>
    </div>

    <div
      class="tw-flex tw-flex-none tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5 tw-px-4 tw-pb-3.5 tw-pt-2.5"
    >
      <span class="tw-text-[11px] tw-text-on-surface-variant">Fewer</span>
      <div class="tw-flex tw-gap-[3px]">
        <span
          v-for="step in HEAT_STEPS"
          :key="step"
          aria-hidden="true"
          class="tw-h-[11px] tw-w-[22px] tw-rounded-[3px]"
          :style="{ backgroundColor: step }"
        />
      </div>
      <span class="tw-text-[11px] tw-text-on-surface-variant">More</span>
      <span v-if="coverage.busiest" class="tw-text-xs">
        <span class="tw-font-bold">Busiest: {{ coverage.busiest.count }}</span>
        — {{ dayNames[coverage.busiest.dayIndex] }} at
        {{ formatHour(coverage.busiest.startMinute) }}
      </span>
      <!--
        A scheduler who adds a column up and finds it wrong stops trusting the
        whole view, so the rule is stated where the numbers are.
      -->
      <span
        class="tw-ml-auto tw-max-w-[420px] tw-text-right tw-text-[11px] tw-leading-[1.45] tw-text-on-surface-variant"
      >
        A cell counts every section meeting during that hour, so a two-hour
        section falls in both. Day totals count each section once.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { coverageByHour } from "../helpers/hourlyCoverage";
import { formatHour } from "../helpers/timeScale";
import type { Meeting } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

const props = defineProps<{
  meetings: Meeting[];
  dayNames: string[];
  /** The sections with no meeting time, which the Async cell counts. */
  asyncCount: number;
  schedule: ScheduleEditor;
}>();

const emit = defineEmits<{ showAsync: [] }>();

const gridRef = ref<HTMLElement | null>(null);

/** Six steps rather than a ramp: a scheduler reads bands, not gradients. */
const HEAT_STEPS = [
  "#f3dfe3",
  "#e8c2c9",
  "#d79ba6",
  "#c47484",
  "#a94a5f",
  "#7a0019",
];

/** Past this step the fill is dark enough that the number needs to go white. */
const FIRST_DARK_STEP = 4;

const coverage = computed(() =>
  coverageByHour(props.meetings, props.dayNames.length),
);

// Measured against the fullest hour rather than against fixed counts: a
// department with a peak of four should read as a full week, not an empty one.
const cellStyle = (count: number) => {
  const peak = coverage.value.busiest?.count ?? 0;
  if (count === 0 || peak === 0) {
    return { backgroundColor: "var(--surface)", color: "var(--on-surface)" };
  }

  const step = Math.min(
    HEAT_STEPS.length - 1,
    Math.ceil((count / peak) * HEAT_STEPS.length) - 1,
  );

  return {
    backgroundColor: HEAT_STEPS[step],
    color: step >= FIRST_DARK_STEP ? "#ffffff" : "var(--on-surface)",
  };
};

// `markedHour`, not the open hour: a cell stays marked while a section
// picked out of it has the sheet.
const isSelected = (dayIndex: number, startMinute: number) => {
  const hour = props.schedule.markedHour;
  return hour?.dayIndex === dayIndex && hour?.startMinute === startMinute;
};

/**
 * Arrow keys walk the grid, which is otherwise a hundred tab stops deep.
 * Cells find each other by the day and hour in their own id rather than
 * through a list of refs.
 */
function onKeyDown(event: KeyboardEvent) {
  const from = (event.target as HTMLElement).dataset.cell;
  if (!from) return;

  const step = STEP_BY_KEY[event.key];
  if (!step) return;

  const [dayIndex, startMinute] = from.split("-").map(Number);
  const nextDay = dayIndex + step.day;
  const nextMinute = startMinute + step.hour * 60;
  const cell = gridRef.value?.querySelector<HTMLElement>(
    `[data-cell="${nextDay}-${nextMinute}"]`,
  );
  if (!cell) return;

  event.preventDefault();
  cell.focus();
}

const STEP_BY_KEY: Record<string, { day: number; hour: number } | undefined> = {
  ArrowLeft: { day: -1, hour: 0 },
  ArrowRight: { day: 1, hour: 0 },
  ArrowUp: { day: 0, hour: -1 },
  ArrowDown: { day: 0, hour: 1 },
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
