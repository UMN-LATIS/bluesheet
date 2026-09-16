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
      :top="ROW_PADDING + lane * LEAVE_LANE_HEIGHT"
      :isSelected="selectedLeaveId === item.id"
      isCompact
      @select="emit('selectLeave', $event)"
    />
    <TermChipColumns
      :axis="axis"
      :sectionsByTerm="row.sectionsByTerm"
      :top="ROW_PADDING + row.leavesHeight"
      :labelOf="courseLabelOf"
      :selectedSectionKey="selectedSectionKey"
      @selectSection="emit('selectSection', $event)"
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
import type { TeachingSection } from "@/types";
import TimelineRow from "./TimelineRow.vue";
import LeaveBar from "./LeaveBar.vue";
import TermChipColumns from "./TermChipColumns.vue";
import { laneByDate } from "../helpers/leaveLanes";
import { spanOf, type TimelineAxis } from "../helpers/timelineAxis";
import { nameOf } from "../helpers/filterOptions";
import type { PersonHistoryRow } from "../helpers/planningRows";

const props = defineProps<{
  rows: PersonHistoryRow[];
  axis: TimelineAxis;
  selectedLeaveId: number | null;
  selectedSectionKey: string | null;
  emptyMessage: string;
}>();

const emit = defineEmits<{
  selectLeave: [leaveId: number];
  selectSection: [sectionKey: string];
}>();

const ROW_PADDING = 8;
const LEAVE_LANE_HEIGHT = 24;
const CHIP_HEIGHT = 26;
const MIN_ROW_HEIGHT = 52;

const courseLabelOf = (section: TeachingSection) =>
  `${section.subject} ${section.catalogNumber}`;

const laidOutRows = computed(() =>
  props.rows.map((row) => {
    const { laned, laneCount } = laneByDate(row.leaves);
    const leavesHeight = laneCount > 0 ? laneCount * LEAVE_LANE_HEIGHT + 4 : 0;
    const tallestTerm = Math.max(
      0,
      ...[...row.sectionsByTerm.values()].map((sections) => sections.length),
    );
    return {
      ...row,
      laned,
      leavesHeight,
      height: Math.max(
        MIN_ROW_HEIGHT,
        ROW_PADDING * 2 + leavesHeight + tallestTerm * CHIP_HEIGHT,
      ),
    };
  }),
);
</script>
