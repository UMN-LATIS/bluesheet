<template>
  <BudgetCell
    role="cell"
    class="tw-flex-col tw-items-stretch tw-justify-center tw-gap-0.5 tw-py-1"
  >
    <button
      v-if="row.emplid !== null"
      type="button"
      class="tw-block tw-min-w-0 tw-cursor-pointer tw-truncate tw-border-none tw-bg-transparent tw-p-0 tw-text-left tw-text-xs tw-font-semibold tw-text-on-surface hover:tw-underline"
      :title="row.name"
      @click="emit('selectPerson', row.emplid)"
    >
      {{ row.name }}
    </button>
    <span
      v-else
      class="tw-block tw-min-w-0 tw-truncate tw-font-semibold tw-text-brand"
      :title="row.name"
    >
      {{ row.name }}
    </span>
    <LeaveBadge
      v-for="leave in row.leaves"
      :key="leave.id"
      class="tw-self-start"
      :leave="leave"
      @click="emit('selectLeave', leave.id)"
    />
  </BudgetCell>
</template>

<script setup lang="ts">
import BudgetCell from "./BudgetCell.vue";
import LeaveBadge from "./LeaveBadge.vue";
import type { PersonRow } from "../../helpers/peopleRows";

defineProps<{ row: PersonRow }>();

const emit = defineEmits<{
  selectPerson: [emplid: number];
  selectLeave: [leaveId: number];
}>();
</script>
