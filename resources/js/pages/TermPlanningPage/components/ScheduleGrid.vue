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

      <DayColumn
        v-for="(day, dayIndex) in DAY_NAMES"
        :key="day"
        :label="day"
        :meetings="meetingsOn(dayIndex)"
        @create="addMeeting(dayIndex, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import DayColumn from "./DayColumn.vue";
import StandardPeriodsColumn from "./StandardPeriodsColumn.vue";
import TimeAxis from "./TimeAxis.vue";
import { A_PERIODS, B_PERIODS } from "../constants/standardMeetingTimes";
import type { Meeting, TimeRange } from "../types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const STANDARD_SCHEDULES = [
  { name: "A", tone: "blue", periods: A_PERIODS },
  { name: "B", tone: "green", periods: B_PERIODS },
] as const;

const meetings = ref<Meeting[]>([]);

const meetingsOn = (dayIndex: number) =>
  meetings.value.filter((meeting) => meeting.dayIndex === dayIndex);

function addMeeting(dayIndex: number, range: TimeRange) {
  meetings.value.push({ id: crypto.randomUUID(), dayIndex, ...range });
}
</script>
