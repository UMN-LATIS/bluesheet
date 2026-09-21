<template>
  <TimelineRow
    v-for="row in laidOutRows"
    :key="row.person.emplid"
    :name="lastFirstNameOf(row.person)"
    :detail="row.person.title"
    :height="row.height"
  >
    <LeaveBar
      v-for="{ item, lane } in row.itemsWithLane"
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
import { stackIntoLanes } from "../helpers/leaveLanes";
import { spanOf, type TimelineAxis } from "../helpers/timelineAxis";
import { lastFirstNameOf } from "../helpers/filterOptions";
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
const ROW_PADDING = 8;
const MIN_ROW_HEIGHT = 52;

const laidOutRows = computed(() =>
  props.rows.map((row) => {
    const { itemsWithLane, laneCount } = stackIntoLanes(row.leaves);
    const barsHeight = (laneCount - 1) * LANE_HEIGHT + BAR_HEIGHT;
    const height = Math.max(MIN_ROW_HEIGHT, barsHeight + ROW_PADDING * 2);
    return {
      ...row,
      itemsWithLane,
      height,
      firstLaneTop: (height - barsHeight) / 2,
    };
  }),
);
</script>
