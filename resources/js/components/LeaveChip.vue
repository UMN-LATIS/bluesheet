<template>
  <Chip
    :color="statusColor"
    class="tw-cursor-pointer"
    :class="{
      'tw-rounded-xl': isOpen,
    }"
    @click="isOpen = !isOpen"
  >
    <header
      class="tw-flex tw-gap-1 tw-items-center"
      :class="{
        'tw-font-bold': isOpen,
      }"
    >
      <CircleCheckIcon v-if="leave.status === 'confirmed'" title="confirmed" />
      <QuestionIcon v-if="leave.status === 'pending'" title="pending" />
      <NoIcon v-if="leave.status === 'cancelled'" title="cancelled" />
      <span
        :class="{
          'tw-line-through': leave.status === 'cancelled',
        }"
      >
        {{ prettyLeaveType }} Leave
      </span>
    </header>

    <div
      v-if="isOpen"
      class="leave-details tw-flex tw-flex-col tw-gap-2 tw-items-center tw-text-xs"
    >
      <ul class="tw-text-xs tw-pl-6 tw-list-none">
        <li>{{ leave.description }}</li>
        <li>
          {{ dayjs(leave.start_date).format("MMM D, YYYY") }} &ndash;
          {{ dayjs(leave.end_date).format("MMM D, YYYY") }}
        </li>
        <li>{{ leave.status }}</li>
      </ul>
    </div>
  </Chip>
</template>
<script setup lang="ts">
import { ISODate, Leave, Term, leaveStatuses } from "@/types";
import { computed, ref } from "vue";
import dayjs from "dayjs";
import Chip from "./Chip.vue";
import { CircleCheckIcon, QuestionIcon, NoIcon } from "@/icons";

const props = defineProps<{
  leave: Leave;
}>();

const isOpen = ref(false);

const prettyLeaveType = computed(() => props.leave.type.replace(/_/g, " "));

const statusColor = computed(() => {
  switch (props.leave.status) {
    case leaveStatuses.PENDING:
      return "orange-600";
    case leaveStatuses.CONFIRMED:
      return "green-600";
    case leaveStatuses.CANCELLED:
      return "neutral-400";
    default:
      return "neutral-400";
  }
});
</script>
