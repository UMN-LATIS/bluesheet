<template>
  <BudgetCell role="cell" class="tw-py-[5px]">
    <span class="tw-flex tw-min-w-0 tw-flex-col">
      <span class="tw-flex tw-min-w-0 tw-items-center tw-gap-1">
        <span
          class="tw-truncate"
          :class="{ 'tw-font-semibold tw-text-brand': isUnstaffed }"
          :title="people.name"
        >
          {{ people.name }}
        </span>
        <span
          v-if="people.otherNames.length > 0"
          class="tw-flex-none tw-cursor-help tw-rounded-full tw-bg-surface-container tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-leading-none tw-text-on-surface-variant"
          :title="people.otherNames.join('; ')"
          :aria-label="`and ${people.otherNames.length} more: ${people.otherNames.join('; ')}`"
        >
          +{{ people.otherNames.length }}
        </span>
      </span>
      <CellSubline v-if="people.jobLabel">
        {{ people.jobLabel }}
      </CellSubline>
    </span>
  </BudgetCell>
</template>

<script setup lang="ts">
import BudgetCell from "./BudgetCell.vue";
import CellSubline from "./CellSubline.vue";
import type { PeopleSummary } from "../../helpers/budgetRows";

withDefaults(defineProps<{ people: PeopleSummary; isUnstaffed?: boolean }>(), {
  isUnstaffed: false,
});
</script>
