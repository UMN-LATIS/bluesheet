<template>
  <div class="schedule-grid">
    <div class="schedule-grid__canvas">
      <div class="schedule-grid__times">
        <div class="schedule-grid__times-header" />
        <div class="schedule-grid__times-body" :style="{ height: bodyHeight }">
          <div
            v-for="hour in hours"
            :key="hour.minute"
            class="schedule-grid__time"
            :style="{ top: offsetOf(hour.minute) }"
          >
            {{ hour.label }}
          </div>
        </div>
      </div>

      <div v-for="day in DAY_NAMES" :key="day" class="schedule-grid__day">
        <div class="schedule-grid__day-header">{{ day }}</div>
        <div class="schedule-grid__day-body" :style="{ height: bodyHeight }">
          <div
            v-for="line in gridLines"
            :key="line.minute"
            :class="[
              'schedule-grid__line',
              line.isHour
                ? 'schedule-grid__line--hour'
                : 'schedule-grid__line--half-hour',
            ]"
            :style="{ top: offsetOf(line.minute) }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const FIRST_HOUR = 8;
const LAST_HOUR = 18;

/**
 * One minute of the day is one pixel tall, which keeps every position on the
 * grid a plain subtraction. Change this to zoom the whole grid vertically.
 */
const PIXELS_PER_MINUTE = 1;

/**
 * Breathing room above the first hour and below the last, so their labels,
 * which straddle their own lines, are not clipped by the grid's edges.
 */
const EDGE_SPACE = 8;

const startMinute = FIRST_HOUR * 60;
const endMinute = LAST_HOUR * 60;

const offsetOf = (minute: number) =>
  `${(minute - startMinute) * PIXELS_PER_MINUTE + EDGE_SPACE}px`;

const bodyHeight = computed(
  () => `${(endMinute - startMinute) * PIXELS_PER_MINUTE + EDGE_SPACE * 2}px`,
);

function formatHour(minute: number): string {
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
}

const hours = computed(() =>
  minutesEvery(60, startMinute).map((minute) => ({
    minute,
    label: formatHour(minute),
  })),
);

/** Hour lines carry the eye across the grid; half-hour lines sit under them. */
const gridLines = computed(() => [
  ...minutesEvery(60, startMinute).map((minute) => ({ minute, isHour: true })),
  ...minutesEvery(60, startMinute + 30).map((minute) => ({
    minute,
    isHour: false,
  })),
]);

function minutesEvery(step: number, from: number): number[] {
  const minutes: number[] = [];
  for (let minute = from; minute <= endMinute; minute += step) {
    minutes.push(minute);
  }
  return minutes;
}
</script>

<style scoped>
.schedule-grid {
  --day-width: 250px;
  --line-color: rgb(0 0 0 / 0.12);

  overflow-x: auto;
  border: 1px solid var(--line-color);
  border-radius: 0.375rem;
  background: #fff;
}

.schedule-grid__canvas {
  display: flex;
  align-items: flex-start;
  width: max-content;
  min-width: 100%;
}

/* Stays put while the days scroll past it. */
.schedule-grid__times {
  position: sticky;
  left: 0;
  z-index: 1;
  flex: none;
  width: 3.5rem;
  border-right: 1px solid var(--line-color);
  background: #fff;
}

.schedule-grid__times-body,
.schedule-grid__day-body {
  position: relative;
}

.schedule-grid__times-header,
.schedule-grid__day-header {
  height: 2rem;
  border-bottom: 1px solid var(--line-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(0 0 0 / 0.6);
}

/* Sits above its hour line so the label reads as a boundary, not a row. */
.schedule-grid__time {
  position: absolute;
  right: 0.375rem;
  transform: translateY(-50%);
  font-size: 0.6875rem;
  color: rgb(0 0 0 / 0.5);
  white-space: nowrap;
}

.schedule-grid__day {
  flex: none;
  width: var(--day-width);
  border-right: 1px solid var(--line-color);
}

.schedule-grid__day:last-child {
  border-right: none;
}

.schedule-grid__line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid var(--line-color);
}

.schedule-grid__line--half-hour {
  border-top-color: rgb(0 0 0 / 0.05);
}
</style>
