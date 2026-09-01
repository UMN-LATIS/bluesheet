<template>
  <div
    class="tw-overflow-x-auto tw-rounded-md tw-border tw-border-solid tw-border-neutral-200 tw-bg-white"
  >
    <!--
      A day's name sticks to the right of the gutter as its column scrolls
      past, so the columns are still identifiable once one is wider than the
      screen. `DayColumn` positions the name against this measurement.
    -->
    <div
      class="tw-flex tw-w-max tw-min-w-full tw-items-start"
      :style="{ '--day-label-offset': `${gutterWidth}px` }"
    >
      <!-- The gutter stays put while the days scroll past it. -->
      <div
        ref="gutter"
        class="tw-sticky tw-left-0 tw-z-10 tw-flex tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-neutral-200 tw-bg-white"
      >
        <StandardPeriodsColumn
          v-for="standard in STANDARD_SCHEDULES"
          :key="standard.name"
          v-bind="standard"
        />
        <TimeAxis />
      </div>

      <!--
        Every pointer gesture is handled here rather than in the columns, since
        a meeting can be carried from one day into another. The columns below
        only draw.
      -->
      <div
        ref="days"
        class="tw-flex tw-items-start"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="dispatch({ type: 'released' })"
        @pointercancel="dispatch({ type: 'cancelled' })"
      >
        <DayColumn
          v-for="(day, dayIndex) in DAY_NAMES"
          :key="day"
          :label="day"
          :dayIndex="dayIndex"
          :view="week[dayIndex]"
          :toneOf="toneOf"
        >
          <!--
            Forwarded only when the page actually supplied content, so that
            a grid used without the slot still falls back to showing times.
          -->
          <template v-if="$slots.block" #block="blockProps">
            <slot name="block" v-bind="blockProps" />
          </template>
        </DayColumn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useElementSize } from "@vueuse/core";
import DayColumn from "./DayColumn.vue";
import StandardPeriodsColumn from "./StandardPeriodsColumn.vue";
import TimeAxis from "./TimeAxis.vue";
import { A_PERIODS, B_PERIODS } from "../constants/standardMeetingTimes";
import type { BlockTone, Meeting } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor/useScheduleEditor";
import { selectWeekView } from "../useScheduleEditor/selectors";
import type { EditorEvent } from "../useScheduleEditor/types";
import { dayIndexAt } from "../helpers/dayLayout";
import { minuteAt } from "../helpers/timeScale";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const STANDARD_SCHEDULES = [
  { name: "A", tone: "blue", periods: A_PERIODS },
  { name: "B", tone: "green", periods: B_PERIODS },
] as const;

const props = defineProps<{
  /**
   * The schedule to draw and to change. The page owns it, so anything else
   * on the page reads the same one.
   */
  schedule: ScheduleEditor;
  /** Answers nothing for a meeting with no class on it, which draws grey. */
  toneOf?: (meeting: Meeting) => BlockTone | undefined;
}>();

const days = ref<HTMLElement | null>(null);
const gutter = ref<HTMLElement | null>(null);
const { width: gutterWidth } = useElementSize(gutter);
const state = computed(() => props.schedule.state.value);
const week = computed(() =>
  selectWeekView(props.schedule.base.value, state.value, DAY_NAMES.length),
);
const dispatch = (event: EditorEvent) => props.schedule.dispatch(event);

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;

  const at = positionOf(event);
  if (!at) return;

  // Capturing on the container means the rest of the gesture arrives here even
  // once the pointer leaves the grid entirely.
  days.value?.setPointerCapture(event.pointerId);

  const target = event.target as HTMLElement;
  const meetingId =
    target.closest<HTMLElement>("[data-meeting-id]")?.dataset.meetingId;
  const edge =
    target.closest<HTMLElement>("[data-resize-edge]")?.dataset.resizeEdge;

  if (!meetingId) {
    dispatch({ type: "pressedEmptySpace", ...at });
  } else if (edge === "start" || edge === "end") {
    dispatch({ type: "pressedMeetingEdge", meetingId, edge, ...at });
  } else {
    dispatch({ type: "pressedMeeting", meetingId, ...at });
  }
}

// On the window rather than the grid: the grid never holds focus, and the
// key should work however far the captured pointer has wandered.
function onKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  if (state.value.interaction.status === "idle") return;
  dispatch({ type: "cancelled" });
}

onMounted(() => window.addEventListener("keydown", onKeyDown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeyDown));

function onPointerMove(event: PointerEvent) {
  // Nothing to decide while idle, so plain hover never measures the DOM.
  if (state.value.interaction.status === "idle") return;

  const at = positionOf(event);
  if (at) dispatch({ type: "pointerMoved", ...at });
}

/**
 * The day and minute a pointer event landed on, in the grid's own terms.
 *
 * One rect fixes the frame — measured per event, so scrolling mid-drag
 * cannot leave stale positions behind — and the widths the layout itself
 * reported locate the day, so the mapping cannot disagree with what is
 * drawn. The minute is handed on as measured; `update` snaps it.
 */
function positionOf(event: PointerEvent) {
  const firstBody = days.value?.querySelector<HTMLElement>("[data-day-index]");
  if (!firstBody) return null;

  // Day bodies share a top edge and sit below the column headers, so the
  // first one's corner anchors both axes.
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
