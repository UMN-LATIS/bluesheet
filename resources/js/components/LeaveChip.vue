<template>
  <Chip :color="statusColor"> {{ leave.description }} ({{ leave.type }}) </Chip>
</template>
<script setup lang="ts">
import { ISODate, Leave, Term, leaveStatuses } from "@/types";
import { computed } from "vue";
import dayjs from "dayjs";
import Chip from "./Chip.vue";

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
