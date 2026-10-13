<template>
  <div
    class="tw-flex tw-flex-none tw-flex-wrap tw-items-center tw-gap-x-[22px] tw-gap-y-2.5 tw-border-0 tw-border-b tw-border-solid tw-border-outline tw-bg-accent-container-low tw-px-4 tw-py-3"
  >
    <span
      v-if="isSectionDataLocked && canEditCosts"
      class="tw-text-xs tw-text-on-surface-variant"
    >
      Sections are locked. Rates and costs can still be changed.
    </span>
    <span
      v-if="totals.missingRateCount > 0"
      class="tw-text-xs tw-font-semibold tw-text-brand"
    >
      {{ totals.missingRateCount }}
      {{ totals.missingRateCount === 1 ? "cost has" : "costs have" }} no rate
      and {{ totals.missingRateCount === 1 ? "is" : "are" }} left out of the
      total
    </span>

    <div
      class="tw-ml-auto tw-grid tw-flex-none tw-grid-cols-[auto_auto] tw-gap-x-2.5 tw-gap-y-0.5 tw-text-xs tw-text-on-surface-variant"
    >
      <span>Instructors</span>
      <b
        class="tw-text-right tw-font-semibold tw-tabular-nums tw-text-on-surface"
      >
        {{ formatWholeDollars(totals.instructorCost) }}
      </b>
      <span>TA support</span>
      <b
        class="tw-text-right tw-font-semibold tw-tabular-nums tw-text-on-surface"
      >
        {{ formatWholeDollars(totals.taCost) }}
      </b>
    </div>

    <div class="tw-flex tw-flex-none tw-flex-col tw-items-end">
      <CapsLabel>{{ heading }}</CapsLabel>
      <span class="tw-text-2xl tw-font-bold tw-tabular-nums tw-tracking-tight">
        {{ formatWholeDollars(totals.total) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CapsLabel from "./CapsLabel.vue";
import { formatWholeDollars } from "../../helpers/money";
import type { CostTotals } from "../../helpers/termEstimate";

const props = defineProps<{
  totals: CostTotals;
  shownCount: number;
  totalCount: number;
  termName: string;
  isSectionDataLocked: boolean;
  canEditCosts: boolean;
}>();

const heading = computed(() =>
  props.shownCount === props.totalCount
    ? `Estimated term cost · ${props.termName}`
    : `Estimated cost · ${props.shownCount} of ${props.totalCount} sections shown`,
);
</script>
