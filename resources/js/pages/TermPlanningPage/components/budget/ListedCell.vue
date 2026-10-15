<template>
  <BudgetCell
    role="cell"
    align="end"
    class="tw-font-semibold"
    :class="{ 'tw-bg-brand-container tw-text-brand': isLoadMismatched }"
  >
    {{ listed }}
  </BudgetCell>
</template>

<script setup lang="ts">
import BudgetCell from "./BudgetCell.vue";

defineProps<{ listed: number; isLoadMismatched: boolean }>();
</script>
