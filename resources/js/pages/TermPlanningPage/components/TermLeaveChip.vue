<template>
  <span
    class="tw-inline-flex tw-h-6 tw-max-w-full tw-flex-none tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-px-2.5 tw-text-[11.5px]"
    :class="
      isIntended
        ? 'tw-border-solid tw-border-outline tw-bg-surface tw-text-on-surface'
        : 'tw-border-dashed tw-border-outline-variant tw-text-on-surface-variant'
    "
    :title="summary"
  >
    <component
      :is="statusIcon"
      class="tw-h-3.5 tw-w-3.5 tw-flex-none"
      aria-hidden="true"
    />
    <span class="tw-truncate tw-font-semibold">{{ personName }}</span>
    <span class="tw-truncate tw-text-on-surface-variant">{{ typeLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import dayjs from "dayjs";
import { CircleCheckIcon, QuestionIcon, SparklesIcon } from "@/icons";
import { leaveStatuses } from "@/types";
import { getLeaveStatusLabel } from "@/utils/leaveStatusHelpers";
import { getLeaveTypeLabel } from "@/utils/leaveTypeHelpers";
import { lastNameFirst } from "../helpers/sectionPeople";
import type { TermLeave } from "@/types";

const props = defineProps<{ leave: TermLeave }>();

const { CONFIRMED, PENDING } = leaveStatuses;

const isIntended = computed(
  () => props.leave.status === CONFIRMED || props.leave.status === PENDING,
);

const statusIcon = computed(() => {
  if (props.leave.status === CONFIRMED) return CircleCheckIcon;
  if (props.leave.status === PENDING) return QuestionIcon;
  return SparklesIcon;
});

const personName = computed(() => {
  const name = props.leave.name;
  if (!name) return String(props.leave.emplid ?? "Unknown");

  return lastNameFirst(name, props.leave.lastName);
});

const typeLabel = computed(() => getLeaveTypeLabel(props.leave.type));

const asDate = (date: string) => dayjs(date).format("MMM D, YYYY");

const summary = computed(() => {
  const status = getLeaveStatusLabel(props.leave.status);
  const dates = `${asDate(props.leave.startDate)} to ${asDate(props.leave.endDate)}`;
  const parts = [typeLabel.value, status, dates, props.leave.description];

  return parts.filter(Boolean).join(" · ");
});
</script>
