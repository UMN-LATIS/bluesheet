<template>
  <div
    ref="scroller"
    class="scrollbar-always-visible tw-relative tw-min-h-0 tw-flex-1 tw-overflow-auto"
    :style="{
      '--lp-name': `${NAME_COLUMN_WIDTH}px`,
      '--lp-header': `${AXIS_HEADER_HEIGHT}px`,
      '--lp-track': `${trackWidth}px`,
      '--lp-trailing': `${trailingScrollRoomPx}px`,
    }"
  >
    <div
      class="tw-sticky tw-top-0 tw-z-20 tw-flex tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
      :style="{
        width: 'calc(var(--lp-name) + var(--lp-track) + var(--lp-trailing))',
      }"
    >
      <div
        class="tw-sticky tw-left-0 tw-z-10 tw-flex tw-flex-none tw-items-end tw-border-0 tw-border-r tw-border-solid tw-border-surface-container tw-bg-surface-bright tw-px-3.5 tw-pb-2"
        :style="{ width: 'var(--lp-name)' }"
      >
        <span
          class="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
        >
          {{ nameHeading }}
        </span>
      </div>

      <div
        class="tw-relative tw-flex-none"
        :style="{ width: 'var(--lp-track)', height: 'var(--lp-header)' }"
      >
        <div
          v-for="termLabel in termLabels"
          :key="termLabel.term.id"
          class="tw-absolute tw-top-2 tw-flex tw-h-6 tw-items-center tw-gap-1.5 tw-overflow-hidden tw-whitespace-nowrap tw-rounded-md tw-bg-surface-container tw-px-2"
          :style="{
            left: `${termLabel.left * 100}%`,
            width: `${termLabel.width * 100}%`,
          }"
          :title="termLabel.term.name"
        >
          <span class="tw-text-[11.5px] tw-font-semibold">
            {{ termLabel.term.name }}
          </span>
          <span
            v-if="termLabel.isPlanned"
            class="tw-inline-flex tw-h-4 tw-items-center tw-rounded-full tw-border tw-border-dashed tw-border-outline tw-px-1.5 tw-text-[9px] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-on-surface-variant"
          >
            Planned
          </span>
          <span
            v-else-if="termLabel.hasRoomForDates"
            class="tw-text-[10px] tw-text-on-surface-variant"
          >
            {{ termLabel.dateRangeLabel }}
          </span>
        </div>

        <span
          v-for="month in monthTicks"
          :key="month.isoDate"
          class="tw-absolute tw-top-[38px] tw-h-3.5 tw-whitespace-nowrap tw-border-0 tw-border-l tw-border-solid tw-border-outline-variant tw-pl-1 tw-text-[10px] tw-leading-[14px] tw-text-on-surface-variant"
          :style="{ left: `${month.left * 100}%` }"
        >
          {{ month.label }}
        </span>

        <span
          v-if="todayLeft !== null"
          class="tw-absolute tw-top-9 -tw-translate-x-1/2 tw-rounded-full tw-bg-on-surface tw-px-1.5 tw-text-[9.5px] tw-font-bold tw-leading-[14px] tw-text-surface-bright"
          :style="{ left: `${todayLeft * 100}%` }"
        >
          Today
        </span>
      </div>
    </div>

    <div
      class="tw-relative"
      :style="{
        width: 'calc(var(--lp-name) + var(--lp-track) + var(--lp-trailing))',
      }"
    >
      <div
        aria-hidden="true"
        class="tw-pointer-events-none tw-absolute tw-inset-y-0"
        :style="{ left: 'var(--lp-name)', width: 'var(--lp-track)' }"
      >
        <div
          v-for="gap in axis.gaps"
          :key="gap.left"
          class="tw-absolute tw-inset-y-0 tw-bg-striped"
          :style="{
            left: `${gap.left * 100}%`,
            width: `${gap.width * 100}%`,
            '--line-color': 'var(--surface-container)',
            '--line-spacing': '6px',
          }"
        />
        <div
          v-if="todayLeft !== null"
          class="tw-absolute tw-inset-y-0 tw-border-0 tw-border-l tw-border-dashed tw-border-on-surface tw-opacity-50"
          :style="{ left: `${todayLeft * 100}%` }"
        />
      </div>

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useElementSize } from "@vueuse/core";
import {
  fractionOf,
  isWithinAxis,
  type TimelineAxis,
} from "../helpers/timelineAxis";
import { formatMonthDay } from "../helpers/dateLabels";
import {
  AXIS_HEADER_HEIGHT,
  HISTORY_PX_PER_DAY,
  LEAVE_TRACK_MIN_WIDTH,
  NAME_COLUMN_WIDTH,
} from "../layout";

const props = defineProps<{
  axis: TimelineAxis;
  nameHeading: string;
  isHistoryShown: boolean;
  plannedTermIds: Set<number>;
  trailingScrollRoomPx: number;
  /** "YYYY-MM-DD" */
  today: string;
  /** Matches a `data-selection-key` inside the rows. */
  selectionKey: string | null;
}>();

const scroller = ref<HTMLElement | null>(null);
const { width: scrollerWidth } = useElementSize(scroller);

const MIN_TICK_SPACING_PX = 36;
const TODAY_LABEL_CLEARANCE_PX = 30;
const DATES_MIN_BAND_PX = 170;

const trackWidth = computed(() => {
  const fitWidth = scrollerWidth.value - NAME_COLUMN_WIDTH;
  const minimumWidth = props.isHistoryShown
    ? props.axis.dayCount * HISTORY_PX_PER_DAY
    : LEAVE_TRACK_MIN_WIDTH;
  return Math.max(fitWidth, minimumWidth);
});

const todayLeft = computed(() =>
  isWithinAxis(props.axis, props.today)
    ? fractionOf(props.axis, props.today)
    : null,
);

const termLabels = computed(() =>
  props.axis.terms.map((axisTerm) => {
    const { term } = axisTerm;
    const startLabel = formatMonthDay(term.startDate);
    const endLabel = formatMonthDay(term.endDate);
    return {
      ...axisTerm,
      isPlanned: props.isHistoryShown && props.plannedTermIds.has(term.id),
      hasRoomForDates: axisTerm.width * trackWidth.value >= DATES_MIN_BAND_PX,
      dateRangeLabel: `${startLabel} – ${endLabel}`,
    };
  }),
);

const monthTicks = computed(() => {
  const months = props.axis.months;
  if (months.length === 0) return [];

  const averageSpacing = trackWidth.value / months.length;
  const step = averageSpacing < MIN_TICK_SPACING_PX ? 2 : 1;

  return months.filter((month, index) => {
    const isClearOfToday =
      todayLeft.value === null ||
      Math.abs(month.left - todayLeft.value) * trackWidth.value >
        TODAY_LABEL_CLEARANCE_PX;
    return index % step === 0 && isClearOfToday;
  });
});

watch(
  () => props.selectionKey,
  async (key) => {
    if (key === null) return;
    await nextTick();
    scroller.value
      ?.querySelector(`[data-selection-key="${CSS.escape(key)}"]`)
      ?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      });
  },
  { immediate: true, flush: "post" },
);
</script>
