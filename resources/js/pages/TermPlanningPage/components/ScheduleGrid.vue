<template>
  <div class="tw-bg-surface-bright">
    <!-- --day-label-offset: where DayColumn pins a scrolling day's name -->
    <div
      class="tw-flex tw-w-max tw-min-w-full tw-items-start"
      :style="{ '--day-label-offset': `${gutterWidth}px` }"
    >
      <!--
        z-40, above the day headers, so the gutter owns the corner where both
        sticky axes meet
      -->
      <div
        ref="gutter"
        class="tw-sticky tw-left-0 tw-z-40 tw-flex tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
      >
        <TimeAxis />
      </div>

      <!--
        pointer events live here, not in the
        columns, since a drag can cross days
      -->
      <div
        ref="days"
        class="tw-flex tw-items-start"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="schedule.release()"
        @pointercancel="schedule.cancel()"
      >
        <DayColumn
          v-for="(day, dayIndex) in DAY_NAMES"
          :key="day"
          :label="day"
          :dayIndex="dayIndex"
          :view="week[dayIndex]"
          :componentOf="componentOf"
        >
          <!--
            forwarded only when supplied, so DayColumn's fallback still applies
          -->
          <template v-if="$slots.block" #block="blockProps">
            <slot name="block" v-bind="blockProps" />
          </template>
        </DayColumn>

        <!--
          Sections with no meeting time, as a day of their own at the end of
          the week. A dashed edge and a dimmer surface say it is not a day on
          the clock, but it belongs in the row: "what is still unplaced" is
          the same kind of question as "what is on Friday", and answering it
          in a tray under the grid put it out of the eye's path.
        -->
        <div
          class="tw-flex-none tw-border-0 tw-border-l tw-border-dashed tw-border-outline-variant tw-bg-surface"
          :style="{ width: `${ASYNC_COLUMN_WIDTH}px` }"
        >
          <ColumnHeader class="!tw-bg-surface">
            <span
              class="tw-text-[12.5px] tw-font-bold tw-uppercase tw-tracking-[0.04em] tw-text-on-surface"
            >
              Async
            </span>
            <span class="tw-text-[11px] tw-text-on-surface-variant">
              {{ unscheduled.length }}
            </span>
          </ColumnHeader>
          <div
            class="scrollbar-always-visible tw-overflow-y-auto tw-p-3"
            :style="{ height: COLUMN_HEIGHT }"
          >
            <AsyncSectionChips
              :sections="unscheduled"
              :selectedSectionId="selectedSectionId"
              :schedule="schedule"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useElementSize } from "@vueuse/core";
import AsyncSectionChips from "./AsyncSectionChips.vue";
import ColumnHeader from "./ColumnHeader.vue";
import DayColumn from "./DayColumn.vue";
import TimeAxis from "./TimeAxis.vue";
import type { Meeting, PlannedSection } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";
import { dayIndexAt } from "../helpers/dayLayout";
import { COLUMN_HEIGHT, minuteAt } from "../helpers/timeScale";
import { WEEKDAY_NAMES } from "../helpers/scheduleDays";

const DAY_NAMES = WEEKDAY_NAMES;

/**
 * Wide enough for two chips side by side, which is what stops a column of
 * two hundred unplaced sections from reading as one long ragged list.
 */
const ASYNC_COLUMN_WIDTH = 282;

const props = defineProps<{
  schedule: ScheduleEditor;
  /**
   * SIS component code (LEC, DIS, …) of a
   * meeting's class, which picks its color.
   */
  componentOf?: (meeting: Meeting) => string | undefined;
  /** The sections with no meeting time, drawn as the week's last column. */
  unscheduled: PlannedSection[];
  /** Which section the sheet is open on, so its chip can show it. */
  selectedSectionId: number | null;
}>();

const days = ref<HTMLElement | null>(null);
const gutter = ref<HTMLElement | null>(null);
const { width: gutterWidth } = useElementSize(gutter);
const week = computed(() => props.schedule.weekView(DAY_NAMES.length));

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;

  const at = positionOf(event);
  if (!at) return;

  const target = event.target as HTMLElement;
  const meetingId =
    target.closest<HTMLElement>("[data-meeting-id]")?.dataset.meetingId;
  const edge =
    target.closest<HTMLElement>("[data-resize-edge]")?.dataset.resizeEdge;

  // TODO: drawing on empty space, once a section can be created for it
  if (!meetingId) return;

  // capture, so the gesture keeps arriving after the pointer leaves the grid
  days.value?.setPointerCapture(event.pointerId);

  if (edge === "start" || edge === "end") {
    props.schedule.pressMeetingEdge(meetingId, edge, at.minute);
  } else {
    props.schedule.pressMeeting(meetingId, at.minute);
  }
}

// on the window: the grid never holds focus
function onKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  props.schedule.cancel();
}

onMounted(() => window.addEventListener("keydown", onKeyDown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeyDown));

function onPointerMove(event: PointerEvent) {
  // Nothing to decide while idle, so plain hover never measures the DOM.
  if (!props.schedule.isGestureInFlight) return;

  const at = positionOf(event);
  if (at) props.schedule.movePointer(at.dayIndex, at.minute);
}

/**
 * The day and minute under a pointer event. Measured per event, so a
 * scroll mid-drag cannot leave stale positions; snapping is `update`'s job.
 */
function positionOf(event: PointerEvent) {
  const firstBody = days.value?.querySelector<HTMLElement>("[data-day-index]");
  if (!firstBody) return null;

  const { left, top } = firstBody.getBoundingClientRect();

  return {
    dayIndex: dayIndexAt(
      event.clientX - left,
      week.value.map((day) => day.layout.width),
    ),
    minute: minuteAt(event.clientY - top),
  };
}
</script>
