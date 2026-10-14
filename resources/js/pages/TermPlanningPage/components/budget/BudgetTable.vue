<template>
  <div
    class="budget-table scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto"
  >
    <div
      role="table"
      :aria-label="label"
      class="tw-grid tw-text-xs"
      v-bind="$attrs"
    >
      <BudgetTableRow
        class="tw-sticky tw-top-0 tw-z-[2] tw-border-0 tw-border-b tw-border-solid tw-border-outline tw-bg-surface-bright"
      >
        <CapsLabel
          v-for="column in columns"
          :key="column.label"
          role="columnheader"
          class="tw-overflow-hidden tw-whitespace-nowrap tw-border-0 tw-border-r tw-border-solid tw-border-surface-container tw-px-2 tw-py-[7px]"
          :class="{ 'tw-text-right': column.isNumeric ?? false }"
        >
          {{ column.label }}
        </CapsLabel>
      </BudgetTableRow>

      <slot />

      <BudgetTableRow
        v-if="$slots.totals"
        class="tw-sticky tw-bottom-0 tw-z-[2] tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-bg-surface tw-font-bold"
      >
        <slot name="totals" />
      </BudgetTableRow>
    </div>
  </div>
</template>

<script setup lang="ts">
import BudgetTableRow from "./BudgetTableRow.vue";
import CapsLabel from "./CapsLabel.vue";

export interface BudgetColumn {
  label: string;
  isNumeric?: boolean;
}

defineOptions({ inheritAttrs: false });

defineProps<{
  label: string;
  columns: BudgetColumn[];
}>();

defineSlots<{
  default(): unknown;
  totals?(): unknown;
}>();
</script>

<style scoped>
.budget-table :deep([role="row"] > :first-child) {
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: inherit;
  box-shadow: inherit;
}
</style>
