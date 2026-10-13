<template>
  <div
    class="tw-flex tw-flex-none tw-flex-wrap tw-items-center tw-gap-x-[22px] tw-gap-y-2.5 tw-border-0 tw-border-b tw-border-solid tw-border-outline tw-bg-accent-container-low tw-px-4 tw-py-3"
  >
    <span
      v-if="totals.missingRateCount > 0"
      class="tw-text-xs tw-font-semibold tw-text-brand"
    >
      {{ missingRateMessage }}
    </span>

    <div
      class="tw-ml-auto tw-grid tw-flex-none tw-grid-cols-[auto_auto] tw-gap-x-2.5 tw-gap-y-0.5 tw-text-xs tw-text-on-surface-variant"
    >
      <span>Instructors</span>
      <b
        class="tw-text-right tw-font-semibold tw-tabular-nums tw-text-on-surface"
      >
        {{ formatWholeDollars(totals.instructorCost)
        }}<OfTermTotal v-if="isFiltered" :dollars="termTotals.instructorCost" />
      </b>
      <span>TA support</span>
      <b
        class="tw-text-right tw-font-semibold tw-tabular-nums tw-text-on-surface"
      >
        {{ formatWholeDollars(totals.taCost)
        }}<OfTermTotal v-if="isFiltered" :dollars="termTotals.taCost" />
      </b>
    </div>

    <div class="tw-flex tw-flex-none tw-flex-col tw-items-end">
      <CapsLabel>{{ heading }}</CapsLabel>
      <span class="tw-text-2xl tw-font-bold tw-tabular-nums tw-tracking-tight">
        {{ formatWholeDollars(totals.total)
        }}<OfTermTotal
          v-if="isFiltered"
          class="tw-text-[13px]"
          :dollars="termTotals.total"
        />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CapsLabel from "./CapsLabel.vue";
import OfTermTotal from "./OfTermTotal.vue";
import { formatWholeDollars } from "../../helpers/money";
import type { CostTotals } from "../../helpers/termEstimate";

const props = defineProps<{
  totals: CostTotals;
  termTotals: CostTotals;
  shownCount: number;
  totalCount: number;
  termName: string;
}>();

const missingRateMessage = computed(() => {
  const count = props.totals.missingRateCount;
  const [subject, verb] =
    count === 1 ? ["cost has", "is"] : ["costs have", "are"];

  return `${count} ${subject} no rate and ${verb} left out of the total`;
});

const isFiltered = computed(() => props.shownCount !== props.totalCount);

const heading = computed(() =>
  !isFiltered.value
    ? `Estimated term cost · ${props.termName}`
    : `Estimated cost · ${props.shownCount} of ${props.totalCount} sections shown`,
);
</script>
