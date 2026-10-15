<template>
  <BudgetCell
    role="cell"
    align="end"
    class="tw-flex-col tw-items-end tw-justify-center tw-font-semibold"
    :class="{ 'tw-bg-brand-container tw-text-brand': mismatchLabel !== null }"
  >
    <span>{{ listed }}</span>
    <CellSubline v-if="mismatchLabel" class="tw-text-brand">{{
      mismatchLabel
    }}</CellSubline>
  </BudgetCell>
</template>

<script setup lang="ts">
import BudgetCell from "./BudgetCell.vue";
import CellSubline from "./CellSubline.vue";

defineProps<{ listed: number; mismatchLabel: string | null }>();
</script>
