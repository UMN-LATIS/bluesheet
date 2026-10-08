<template>
  <div
    class="tw-flex tw-flex-none tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-2 tw-border-0 tw-border-b tw-border-solid tw-border-outline tw-bg-accent-container-low tw-px-4 tw-py-3"
  >
    <div class="tw-flex tw-flex-col">
      <CapsLabel>{{ heading }}</CapsLabel>
      <span class="tw-text-2xl tw-font-bold tw-tabular-nums tw-tracking-tight">
        {{ formatWholeDollars(totals.total) }}
      </span>
    </div>

    <div
      class="tw-flex tw-flex-col tw-gap-0.5 tw-text-xs tw-text-on-surface-variant"
    >
      <HeaderFigure
        label="Instructors"
        :value="formatWholeDollars(totals.instructorCost)"
      />
      <HeaderFigure
        label="TA support"
        :value="formatWholeDollars(totals.taCost)"
      />
    </div>

    <div
      class="tw-flex tw-flex-col tw-gap-0.5 tw-text-xs tw-text-on-surface-variant"
    >
      <HeaderFigure
        label="Recurring budget"
        :value="`${totals.recurringBudgetSectionCount} sections`"
        after=", no added cost"
      />
      <span
        v-if="totals.overrideCount > 0"
        class="tw-flex tw-items-center tw-gap-1.5"
      >
        <span
          class="tw-h-2 tw-w-2 tw-rounded-full tw-bg-accent"
          aria-hidden="true"
        />
        {{ totals.overrideCount }}
        {{ totals.overrideCount === 1 ? "override" : "overrides" }}
      </span>
      <span
        v-if="totals.missingRateCount > 0"
        class="tw-font-semibold tw-text-brand"
      >
        {{ totals.missingRateCount }} without a rate, not in the total
      </span>
    </div>

    <span class="tw-ml-auto tw-text-[11px] tw-text-on-surface-variant">
      Estimate from job-code averages, not pay
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CapsLabel from "./CapsLabel.vue";
import HeaderFigure from "./HeaderFigure.vue";
import { formatWholeDollars } from "../../helpers/money";
import type { CostTotals } from "../../helpers/termEstimate";

const props = defineProps<{
  totals: CostTotals;
  shownCount: number;
  totalCount: number;
  termName: string;
}>();

const heading = computed(() =>
  props.shownCount === props.totalCount
    ? `Estimated term cost · ${props.termName}`
    : `Estimated cost · ${props.shownCount} of ${props.totalCount} sections shown`,
);
</script>
