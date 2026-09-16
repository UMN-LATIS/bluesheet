<template>
  <TimelineRow
    v-for="row in laidOutRows"
    :key="row.person.emplid"
    :name="nameOf(row.person)"
    :detail="row.person.title"
    :height="row.height"
  >
    <LeaveBar
      v-for="{ item, lane } in row.laned"
      :key="item.id"
      :leave="item"
      :person="row.person"
      :span="spanOf(axis, item.startDate, item.endDate)"
      :top="row.firstLaneTop + lane * LANE_HEIGHT"
      :isSelected="selectedLeaveId === item.id"
      @select="emit('selectLeave', $event)"
    />
  </TimelineRow>

  <p
    v-if="rows.length === 0"
    class="tw-sticky tw-left-0 tw-m-0 tw-px-4 tw-py-10 tw-text-center tw-text-[12.5px] tw-text-on-surface-variant"
    :style="{ width: 'calc(var(--lp-name) + var(--lp-track))' }"
  >
    {{ emptyMessage }}
  </p>
</template>

<script setup lang="ts">
import { computed } from "vue";
import TimelineRow from "./TimelineRow.vue";
import LeaveBar from "./LeaveBar.vue";
import { laneByDate } from "../helpers/leaveLanes";
import { spanOf, type TimelineAxis } from "../helpers/timelineAxis";
import { nameOf } from "../helpers/filterOptions";
import type { LeaveRow } from "../helpers/planningRows";

const props = defineProps<{
  rows: LeaveRow[];
  axis: TimelineAxis;
  selectedLeaveId: number | null;
  emptyMessage: string;
}>();

const emit = defineEmits<{ selectLeave: [leaveId: number] }>();

const LANE_HEIGHT = 30;
const BAR_HEIGHT = 24;
const MIN_ROW_HEIGHT = 52;

const laidOutRows = computed(() =>
  props.rows.map((row) => {
    const { laned, laneCount } = laneByDate(row.leaves);
    const barsHeight = laneCount * LANE_HEIGHT - (LANE_HEIGHT - BAR_HEIGHT);
    const height = Math.max(MIN_ROW_HEIGHT, barsHeight + 16);
    return {
      ...row,
      laned,
      height,
      firstLaneTop: (height - barsHeight) / 2,
    };
  }),
);
</script>
