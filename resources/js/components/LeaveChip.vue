<template>
  <Chip :color="statusColor">
    <div class="tw-flex tw-gap-1 tw-items-center">
      <CircleCheckIcon v-if="leave.status === 'confirmed'" title="confirmed" />
      <QuestionIcon v-if="leave.status === 'pending'" title="pending" />
      <NoIcon v-if="leave.status === 'cancelled'" title="cancelled" />
      <span
        :class="{
          'tw-line-through': leave.status === 'cancelled',
        }"
      >
        {{ leave.description }} ({{ leave.type }})
      </span>
    </div>
  </Chip>
</template>
<script setup lang="ts">
import { ISODate, Leave, Term, leaveStatuses } from "@/types";
import { computed } from "vue";
import dayjs from "dayjs";
import Chip from "./Chip.vue";
import { CircleCheckIcon, QuestionIcon, NoIcon } from "@/icons";

const props = defineProps<{
  leave: Leave;
}>();

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
