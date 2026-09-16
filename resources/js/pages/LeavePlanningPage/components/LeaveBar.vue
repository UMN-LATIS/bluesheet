<template>
  <button
    type="button"
    :data-selection-key="`leave-${leave.id}`"
    :title="summary"
    :aria-pressed="isSelected"
    class="tw-absolute tw-flex tw-cursor-pointer tw-items-center tw-gap-1 tw-overflow-hidden tw-whitespace-nowrap tw-rounded-full tw-border tw-px-2 tw-leading-none"
    :class="[
      `tw-text-${color}`,
      `tw-border-${color}/40`,
      `tw-bg-${color}/10`,
      isCompact ? 'tw-text-[10.5px]' : 'tw-text-[11px]',
      isDashed ? 'tw-border-dashed' : 'tw-border-solid',
      {
        'tw-opacity-60': isEligibleWhenTenured,
        'tw-rounded-l-none tw-border-l-0': span.isClippedAtStart,
        'tw-rounded-r-none tw-border-r-0': span.isClippedAtEnd,
        'tw-ring-2 tw-ring-primary': isSelected,
      },
    ]"
    :style="{
      top: `${top}px`,
      height: `${isCompact ? 20 : 24}px`,
      left: `${span.left * 100}%`,
      width: `max(${span.width * 100}%, 12px)`,
      scrollMarginTop: 'calc(var(--lp-header) + 8px)',
      scrollMarginLeft: 'calc(var(--lp-name) + 12px)',
      scrollMarginRight: 'calc(var(--lp-trailing) + 12px)',
    }"
    @click="emit('select', leave.id)"
  >
    <ChevronRightIcon
      v-if="span.isClippedAtStart"
      class="tw-h-2.5 tw-w-2.5 tw-flex-none tw-rotate-180"
      aria-hidden="true"
    />
    <component
      :is="getLeaveStatusIcon(leave.status)"
      class="tw-h-3 tw-w-3 tw-flex-none"
      aria-hidden="true"
    />
    <span class="tw-truncate" :class="{ 'tw-line-through': isCancelled }">
      {{ label }}
    </span>
    <ChevronRightIcon
      v-if="span.isClippedAtEnd"
      class="tw-ms-auto tw-h-2.5 tw-w-2.5 tw-flex-none"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronRightIcon } from "@/icons";
import {
  leaveStatuses,
  type PlanningLeave,
  type PlanningPerson,
} from "@/types";
import {
  getLeaveStatusColor,
  getLeaveStatusIcon,
  getLeaveStatusLabel,
} from "@/utils/leaveStatusHelpers";
import {
  isEligibleWhenTenured as isEligibleWhenTenuredFor,
  leaveBarLabelOf,
} from "../helpers/leaveLabels";
import { formatDateRange } from "../helpers/dateLabels";
import type { AxisSpan } from "../helpers/timelineAxis";

const props = defineProps<{
  leave: PlanningLeave;
  person: PlanningPerson | undefined;
  span: AxisSpan;
  top: number;
  isSelected: boolean;
  isCompact?: boolean;
}>();

const emit = defineEmits<{ select: [leaveId: number] }>();

const color = computed(() => getLeaveStatusColor(props.leave.status));
const isCancelled = computed(
  () => props.leave.status === leaveStatuses.DEFERRED,
);
const isEligibleWhenTenured = computed(() =>
  isEligibleWhenTenuredFor(props.leave, props.person),
);
const isDashed = computed(
  () => isCancelled.value || isEligibleWhenTenured.value,
);
const label = computed(() => leaveBarLabelOf(props.leave, props.person));
const summary = computed(
  () =>
    `${label.value} · ${getLeaveStatusLabel(props.leave.status)} · ${formatDateRange(props.leave.startDate, props.leave.endDate)}`,
);
</script>
