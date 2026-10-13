<template>
  <div class="tw-min-h-0 tw-flex-1 tw-overflow-auto tw-px-[18px] tw-py-4">
    <CapsLabel class="tw-mb-1.5 tw-block">
      Rates · {{ fiscalYearLabel(assumptions.fiscalYear) }} ·
      {{ termName }}
    </CapsLabel>
    <div
      role="table"
      aria-label="Rates"
      class="tw-max-w-[720px] tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-text-xs"
    >
      <div
        role="row"
        class="tw-grid tw-border-0 tw-border-b tw-border-solid tw-border-outline"
        :style="{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }"
      >
        <CapsLabel
          v-for="column in HEADINGS"
          :key="column.label"
          role="columnheader"
          class="tw-border-0 tw-border-r tw-border-solid tw-border-surface-container tw-px-2 tw-py-[7px]"
          :class="{ 'tw-text-right': column.isNumeric }"
        >
          {{ column.label }}
        </CapsLabel>
      </div>
      <div
        v-for="row in rows"
        :key="rateOverrideKeyOf(row.rate)"
        role="row"
        class="tw-grid tw-min-h-9"
        :style="{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }"
      >
        <BudgetCell role="cell" class="tw-font-semibold tw-tabular-nums">
          {{ row.code }}
        </BudgetCell>
        <BudgetCell role="cell">
          <span class="tw-truncate" :title="row.title">{{ row.title }}</span>
        </BudgetCell>
        <BudgetCell role="cell" class="tw-text-on-surface-variant">
          {{ row.fundLabel }}
        </BudgetCell>
        <RateInputCell
          role="cell"
          :hasRightBorder="false"
          :amount="row.amount"
          :amountWithoutOverride="row.novaAmount"
          :isOverridden="row.isOverriddenForTerm"
          :canEdit="canEdit"
          :label="`Rate for ${row.code} ${row.title}`"
          @change="(amount) => editRate(row, amount)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CostAssumptions } from "@/types";
import BudgetCell from "./BudgetCell.vue";
import CapsLabel from "./CapsLabel.vue";
import RateInputCell from "./RateInputCell.vue";
import {
  rateOverrideKeyOf,
  type RateOverrideEdit,
  type RateOverrides,
} from "../../helpers/costOverrides";
import { fiscalYearLabel } from "../../helpers/fiscalYear";
import { rateRowsOf, type RateRow } from "../../helpers/rateRows";

const props = defineProps<{
  assumptions: CostAssumptions;
  rateOverrides: RateOverrides;
  canEdit: boolean;
  instructorEmplids: Set<number>;
  termName: string;
}>();

const emit = defineEmits<{ editRate: [edit: RateOverrideEdit] }>();

const GRID_TEMPLATE_COLUMNS = "80px minmax(0,1fr) 96px 150px";

const HEADINGS = [
  { label: "Code", isNumeric: false },
  { label: "Title", isNumeric: false },
  { label: "Fund", isNumeric: false },
  { label: "Rate", isNumeric: true },
];

const rows = computed(() =>
  rateRowsOf(props.assumptions, props.rateOverrides, props.instructorEmplids),
);

function editRate(row: RateRow, amount: number | null) {
  const isNovaRate = amount === null || amount === row.novaAmount;
  emit("editRate", { rate: row.rate, amount: isNovaRate ? null : amount });
}
</script>
