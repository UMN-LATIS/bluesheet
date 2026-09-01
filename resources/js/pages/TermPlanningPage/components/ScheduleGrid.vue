<template>
  <div
    class="tw-overflow-x-auto tw-rounded-md tw-border tw-border-solid tw-border-neutral-200 tw-bg-white"
  >
    <div class="tw-flex tw-w-max tw-min-w-full tw-items-start">
      <!-- The gutter stays put while the days scroll past it. -->
      <div
        class="tw-sticky tw-left-0 tw-z-10 tw-flex tw-flex-none tw-border-0 tw-border-r tw-border-solid tw-border-neutral-200 tw-bg-white"
      >
        <StandardPeriodsColumn
          v-for="schedule in STANDARD_SCHEDULES"
          :key="schedule.name"
          v-bind="schedule"
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
          :view="selectDayView(state, dayIndex)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import DayColumn from "./DayColumn.vue";
import StandardPeriodsColumn from "./StandardPeriodsColumn.vue";
import TimeAxis from "./TimeAxis.vue";
import { A_PERIODS, B_PERIODS } from "../constants/standardMeetingTimes";
import { useScheduleEditor } from "../useScheduleEditor/useScheduleEditor";
import { selectDayView } from "../useScheduleEditor/selectors";
import { minuteAt, snapToGrid } from "../helpers/timeScale";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const STANDARD_SCHEDULES = [
  { name: "A", tone: "blue", periods: A_PERIODS },
  { name: "B", tone: "green", periods: B_PERIODS },
] as const;

const days = ref<HTMLElement | null>(null);
const { state, dispatch } = useScheduleEditor();

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

function onPointerMove(event: PointerEvent) {
  const at = positionOf(event);
  if (at) dispatch({ type: "pointerMoved", ...at });
}

/** The day and minute a pointer event landed on, in the grid's own terms. */
function positionOf(event: PointerEvent) {
  const column = columnUnder(event.clientX);
  if (!column) return null;

  return {
    dayIndex: column.dayIndex,
    minute: snapToGrid(minuteAt(event.clientY - column.top)),
  };
}

/**
 * Which day the pointer is over. Measured on every call rather than cached,
 * so scrolling the grid mid-drag cannot leave stale positions behind. Past
 * either end it holds to the outermost day rather than letting a meeting
 * escape the week.
 */
function columnUnder(clientX: number) {
  const bodies = Array.from(
    days.value?.querySelectorAll<HTMLElement>("[data-day-index]") ?? [],
  ).map((element) => {
    // A DOMRect keeps its values on the prototype, so spreading one yields an
    // empty object. The fields have to be read across by hand.
    const { left, right, top } = element.getBoundingClientRect();
    return { dayIndex: Number(element.dataset.dayIndex), left, right, top };
  });

  if (!bodies.length) return null;

  return (
    bodies.find((body) => clientX >= body.left && clientX < body.right) ??
    (clientX < bodies[0].left ? bodies[0] : bodies[bodies.length - 1])
  );
}
</script>
