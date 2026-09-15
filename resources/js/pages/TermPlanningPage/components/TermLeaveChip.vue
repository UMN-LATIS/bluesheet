<template>
  <Chip
    :color="statusColor"
    :class="`tw-inline-flex tw-items-center tw-gap-1 tw-bg-${statusColor}/5 tw-border-${statusColor}/40`"
    :title="summary"
  >
    <component
      :is="statusIcon"
      class="tw-h-4 tw-w-4 tw-flex-none"
      aria-hidden="true"
    />
    <span
      class="group-hover:tw-underline"
      :class="{ 'tw-line-through': leave.status === DEFERRED }"
    >
      {{ personName }} &middot; {{ typeLabel }}
    </span>
  </Chip>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import Chip from "@/components/Chip.vue";
import { leaveStatuses, type TermLeave } from "@/types";
import {
  getLeaveStatusColor,
  getLeaveStatusIcon,
  getLeaveStatusLabel,
} from "@/utils/leaveStatusHelpers";
import { getLeaveTypeLabel } from "@/utils/leaveTypeHelpers";
import { lastNameFirst } from "../helpers/sectionPeople";

const props = defineProps<{ leave: TermLeave }>();

const { DEFERRED } = leaveStatuses;

const statusColor = computed(() => getLeaveStatusColor(props.leave.status));
const statusIcon = computed(() => getLeaveStatusIcon(props.leave.status));
const typeLabel = computed(() => getLeaveTypeLabel(props.leave.type));

const personName = computed(() => {
  const name = props.leave.name;
  if (!name) return String(props.leave.emplid ?? "Unknown");

  return lastNameFirst(name, props.leave.lastName);
});

const asDate = (date: string) => dayjs(date).format("MMM D, YYYY");

const summary = computed(() => {
  const status = getLeaveStatusLabel(props.leave.status);
  const dates = `${asDate(props.leave.startDate)} to ${asDate(props.leave.endDate)}`;

  return [typeLabel.value, status, dates, props.leave.description]
    .filter(Boolean)
    .join(" · ");
});
</script>
