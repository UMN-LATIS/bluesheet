<template>
  <div
    v-if="courseView.onLeave.length > 0"
    class="tw-border-0 tw-border-b tw-border-solid tw-border-outline-variant tw-bg-surface tw-pb-1.5 tw-pt-1"
    :style="{
      width: 'calc(var(--lp-name) + var(--lp-track) + var(--lp-trailing))',
    }"
  >
    <div
      class="tw-sticky tw-left-0 tw-px-3.5 tw-pb-0.5 tw-pt-1 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
      :style="{ width: 'var(--lp-name)' }"
    >
      On leave · {{ courseView.onLeave.length }}
    </div>
    <div
      v-for="row in laidOutLeaveRows"
      :key="row.person.emplid"
      class="tw-flex"
      :style="{ minHeight: `${row.height}px` }"
    >
      <div
        class="tw-sticky tw-left-0 tw-z-10 tw-flex tw-flex-none tw-items-center tw-truncate tw-bg-surface tw-px-3.5 tw-text-xs"
        :style="{ width: 'var(--lp-name)' }"
      >
        {{ nameOf(row.person) }}
      </div>
      <div
        class="tw-relative tw-flex-none"
        :style="{ width: 'var(--lp-track)' }"
      >
        <LeaveBar
          v-for="{ item, lane } in row.laned"
          :key="item.id"
          :leave="item"
          :person="row.person"
          :span="spanOf(axis, item.startDate, item.endDate)"
          :top="4 + lane * LEAVE_LANE_HEIGHT"
          :isSelected="selectedLeaveId === item.id"
          isCompact
          @select="emit('selectLeave', $event)"
        />
      </div>
    </div>
  </div>

  <TimelineRow
    v-for="row in laidOutCourseRows"
    :key="row.courseCode"
    :name="`${row.subject} ${row.catalogNumber}`"
    :detail="row.title"
    :height="row.height"
  >
    <TermChipColumns
      :axis="axis"
      :sectionsByTerm="row.sectionsByTerm"
      :top="ROW_PADDING"
      :labelOf="instructorLabelOf"
      :selectedSectionKey="selectedSectionKey"
      @selectSection="emit('selectSection', $event)"
    />
  </TimelineRow>

  <p
    v-if="courseView.courses.length === 0"
    class="tw-sticky tw-left-0 tw-m-0 tw-px-4 tw-py-10 tw-text-center tw-text-[12.5px] tw-text-on-surface-variant"
    :style="{ width: 'calc(var(--lp-name) + var(--lp-track))' }"
  >
    {{ emptyMessage }}
  </p>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PlanningPerson, TeachingSection } from "@/types";
import TimelineRow from "./TimelineRow.vue";
import LeaveBar from "./LeaveBar.vue";
import TermChipColumns from "./TermChipColumns.vue";
import { laneByDate } from "../helpers/leaveLanes";
import { spanOf, type TimelineAxis } from "../helpers/timelineAxis";
import { nameOf } from "../helpers/filterOptions";
import type { CourseView } from "../helpers/planningRows";

const props = defineProps<{
  courseView: CourseView;
  axis: TimelineAxis;
  peopleByEmplid: Map<number, PlanningPerson>;
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
const INSTRUCTOR_ROLES = ["PI", "SI"];

const instructorLabelOf = (section: TeachingSection) =>
  section.instructors
    .filter(({ role }) => INSTRUCTOR_ROLES.includes(role))
    .map(
      ({ emplid }) =>
        props.peopleByEmplid.get(emplid)?.lastName || String(emplid),
    )
    .join(", ") || "TBA";

const laidOutLeaveRows = computed(() =>
  props.courseView.onLeave.map((row) => {
    const { laned, laneCount } = laneByDate(row.leaves);
    return { ...row, laned, height: laneCount * LEAVE_LANE_HEIGHT + 8 };
  }),
);

const laidOutCourseRows = computed(() =>
  props.courseView.courses.map((row) => {
    const tallestTerm = Math.max(
      0,
      ...[...row.sectionsByTerm.values()].map((sections) => sections.length),
    );
    return {
      ...row,
      height: Math.max(
        MIN_ROW_HEIGHT,
        ROW_PADDING * 2 + tallestTerm * CHIP_HEIGHT,
      ),
    };
  }),
);
</script>
