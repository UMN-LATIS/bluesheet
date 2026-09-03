<!--
  The day canvas: one weekday (or Async) read as a list grouped by start
  time, instead of the week grid's to-scale columns. This is the only view a
  small screen gets, since a narrow column of drawn time stops being
  readable long before a list of cards does. It deliberately has no time
  axis and no drag or resize: a card opens the section sheet, and the
  sheet's time fields are how a meeting actually moves.
-->
<template>
  <div class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
    <DayTabs
      :dayIndex="dayIndex"
      :counts="counts"
      :size="size"
      @select="emit('selectDay', $event)"
    />

    <div
      class="tw-flex tw-flex-none tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-bg-surface tw-px-4 tw-py-2.5"
    >
      <p class="tw-m-0 tw-text-[12.5px]">
        <template v-if="isAsync">
          <span class="tw-font-semibold">{{ dayCount }}</span> sections with no
          set time
        </template>
        <template v-else>
          <span class="tw-font-semibold">{{ dayCount }}</span> classes on
          {{ fullDayName }}
        </template>
      </p>

      <span
        v-if="unassignedCount > 0"
        class="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright tw-px-2.5 tw-py-[3px] tw-text-[11.5px]"
      >
        <span class="tw-h-[7px] tw-w-[7px] tw-rounded-full tw-bg-brand" />
        {{ unassignedCount }} unassigned
      </span>

      <span
        v-if="!isAsync && busiest && size !== 'small'"
        class="tw-ml-auto tw-text-[11.5px] tw-text-on-surface-variant"
      >
        Busiest hour: {{ busiest.label }}
      </span>
    </div>

    <div
      class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-y-auto"
    >
      <div v-if="isAsync" class="tw-p-3">
        <AsyncSectionChips
          :sections="unscheduled"
          :selectedSectionId="schedule.selectedSectionId"
          :schedule="schedule"
        />
      </div>

      <template v-else>
        <p
          v-if="bands.length === 0"
          class="tw-p-8 tw-text-center tw-text-sm tw-text-on-surface-variant"
        >
          Nothing meets on {{ fullDayName }}.
        </p>

        <section
          v-for="band in bands"
          :key="band.startMinute"
          :class="
            size === 'large'
              ? 'tw-flex tw-gap-4 tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-px-4 tw-py-3.5'
              : 'tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-px-4 tw-py-3'
          "
        >
          <span
            class="tw-text-[13px] tw-font-bold tw-tabular-nums tw-text-on-surface"
            :class="
              size === 'large'
                ? 'tw-w-[84px] tw-flex-none tw-pt-0.5'
                : 'tw-mb-2 tw-block'
            "
          >
            {{ band.label }}
          </span>

          <div
            :class="
              size === 'large'
                ? 'tw-grid tw-min-w-0 tw-flex-1 tw-grid-cols-4 tw-gap-2'
                : size === 'medium'
                  ? 'tw-grid tw-grid-cols-2 tw-gap-2'
                  : 'tw-flex tw-flex-col tw-gap-[7px]'
            "
          >
            <DayCard
              v-for="item in band.items"
              :key="item.meetingId"
              :item="item"
              :size="size"
              :isSelected="isItemSelected(item)"
              :isEdited="schedule.hasEdits(item.section.id)"
              :isReadOnly="schedule.isReadOnly"
              @click="schedule.selectSection(item.section.id)"
            />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AsyncSectionChips from "./AsyncSectionChips.vue";
import DayCard from "./DayCard.vue";
import DayTabs from "./DayTabs.vue";
import {
  bandsForDay,
  busiestBand,
  type DayBandItem,
} from "../helpers/dayBands";
import { isAsyncDay } from "../helpers/scheduleDays";
import type { Meeting, PlannedSection } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";
import type { ScreenSize } from "../useScreenSize";

const props = defineProps<{
  dayIndex: number;
  meetings: Meeting[];
  sectionOf: (meetingId: string) => PlannedSection | undefined;
  unscheduled: PlannedSection[];
  /** One count per tab: the five weekdays, then the unscheduled sections. */
  counts: number[];
  schedule: ScheduleEditor;
  size: ScreenSize;
}>();

const emit = defineEmits<{ selectDay: [dayIndex: number] }>();

const isAsync = computed(() => isAsyncDay(props.dayIndex));

const FULL_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const fullDayName = computed(() => FULL_DAY_NAMES[props.dayIndex] ?? "");

const dayCount = computed(() => props.counts[props.dayIndex] ?? 0);

const bands = computed(() =>
  isAsync.value
    ? []
    : bandsForDay(props.meetings, props.sectionOf, props.dayIndex),
);

const busiest = computed(() => busiestBand(bands.value));

/**
 * How many of the sections on view have nobody teaching them. Counted by
 * section id, so a class meeting twice in one day is not counted twice.
 */
const unassignedCount = computed(() => {
  const onView = isAsync.value
    ? props.unscheduled
    : bands.value.flatMap((band) => band.items.map(({ section }) => section));

  return new Set(
    onView
      .filter(({ instructors }) => instructors.length === 0)
      .map(({ id }) => id),
  ).size;
});

// A card stands for both: the block it draws and the section that block
// belongs to, either of which the selection may name.
const isItemSelected = (item: DayBandItem): boolean =>
  props.schedule.selectedMeetingId === item.meetingId ||
  props.schedule.selectedSectionId === item.section.id;
</script>
