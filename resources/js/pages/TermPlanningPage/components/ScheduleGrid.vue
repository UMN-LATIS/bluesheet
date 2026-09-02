<template>
  <div class="tw-bg-white">
    <!--
      A day's name sticks to the right of the gutter as its column scrolls
      past, so the columns are still identifiable once one is wider than the
      screen. `DayColumn` positions the name against this measurement.
    -->
    <div
      class="tw-flex tw-w-max tw-min-w-full tw-items-start"
      :style="{ '--day-label-offset': `${gutterWidth}px` }"
    >
      <!--
        The gutter stays put while the days scroll past it. z-40, above the
        day headers, so its own header owns the corner where the two sticky
        axes meet.
      -->
      <div
        ref="gutter"
        class="tw-sticky tw-left-0 tw-z-40 tw-flex tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-neutral-200 tw-bg-white"
      >
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
import TimeAxis from "./TimeAxis.vue";
import type { Meeting } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";
import { dayIndexAt } from "../helpers/dayLayout";
import { minuteAt } from "../helpers/timeScale";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const props = defineProps<{
  /**
   * The schedule to draw and to change. The page owns it, so anything else
   * on the page reads the same one.
   */
  schedule: ScheduleEditor;
  /**
   * The SIS component code (LEC, DIS, …) of the class on a meeting, which
   * picks the block's colour. Undefined for a meeting with no class yet.
   */
  componentOf?: (meeting: Meeting) => string | undefined;
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

  // Drawing a new meeting on empty space is switched off until there is a
  // way to create the section it would belong to (epic slice 6). The editor
  // still understands `pressedEmptySpace`; the grid just does not send it.
  if (!meetingId) return;

  // Capturing on the container means the rest of the gesture arrives here even
  // once the pointer leaves the grid entirely.
  days.value?.setPointerCapture(event.pointerId);

  if (edge === "start" || edge === "end") {
    props.schedule.pressMeetingEdge(meetingId, edge, at.minute);
  } else {
    props.schedule.pressMeeting(meetingId, at.minute);
  }
}

// On the window rather than the grid: the grid never holds focus, and the
// key should work however far the captured pointer has wandered. Always
// dispatched; `update` decides whether that discards a gesture or clears
// the selection.
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
