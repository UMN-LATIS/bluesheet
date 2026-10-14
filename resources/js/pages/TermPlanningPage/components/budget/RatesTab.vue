<template>
  <div class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-px-[18px] tw-py-4">
    <CapsLabel class="tw-mb-1.5 tw-block">Rates · {{ termName }}</CapsLabel>
    <BudgetTable
      class="tw-min-w-[720px] tw-max-w-[860px] tw-grid-cols-[72px_minmax(0,1fr)_84px_84px_120px_96px_120px]"
      label="Rates"
      :columns="COLUMNS"
      :rows="rows"
    >
      <template #default="{ rows: shownRows }">
        <BudgetTableRow
          v-for="row in shownRows"
          :key="row.code"
          class="tw-min-h-9 tw-bg-surface-bright"
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
          <BudgetCell role="cell" class="tw-text-on-surface-variant">
            {{ row.perLabel }}
          </BudgetCell>
          <BudgetCell role="cell" class="tw-p-0">
            <EditableCell
              class="tw-w-full"
              kind="dollars"
              :amount="row.salary.amount"
              :amountWithoutOverride="row.salary.novaAmount"
              :isOverridden="row.salary.isOverridden"
              :canEdit="canEdit && !row.isRecurring"
              :label="`Salary for ${row.code} ${row.title}`"
              @change="(amount) => editRate(row, 'salary', amount)"
            />
          </BudgetCell>
          <BudgetCell role="cell" class="tw-p-0">
            <EditableCell
              v-if="!row.isRecurring"
              class="tw-w-full"
              kind="percent"
              :amount="row.fringeRate.amount"
              :amountWithoutOverride="row.fringeRate.novaAmount"
              :isOverridden="row.fringeRate.isOverridden"
              :canEdit="canEdit"
              :label="`Fringe for ${row.code} ${row.title}`"
              @change="(amount) => editRate(row, 'fringeRate', amount)"
            />
            <span v-else class="tw-w-full tw-px-2 tw-text-right">–</span>
          </BudgetCell>
          <BudgetCell
            role="cell"
            align="end"
            :hasRightBorder="false"
            class="tw-font-semibold"
          >
            <MissingRate v-if="row.cost === null" />
            <template v-else>{{ formatDollars(row.cost) }}</template>
          </BudgetCell>
        </BudgetTableRow>
      </template>
    </BudgetTable>
    <p
      class="tw-m-0 tw-mt-3 tw-max-w-[860px] tw-text-[11px] tw-text-on-surface-variant"
    >
      Cost = salary × (1 + fringe), per section held. Grad student codes are on
      the Grad Rates tab.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CostAssumptions } from "@/types";
import BudgetCell from "./BudgetCell.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import CapsLabel from "./CapsLabel.vue";
import EditableCell from "./EditableCell.vue";
import MissingRate from "./MissingRate.vue";
import type {
  RateField,
  RateOverrideEdit,
  RateOverrides,
} from "../../helpers/costOverrides";
import { formatDollars } from "../../helpers/money";
import { rateRowsOf, type RateRow } from "../../helpers/rateRows";

const props = defineProps<{
  assumptions: CostAssumptions;
  rateOverrides: RateOverrides;
  canEdit: boolean;
  chargedEmplids: Set<number>;
  termName: string;
}>();

const emit = defineEmits<{ editRate: [edit: RateOverrideEdit] }>();

const COLUMNS: BudgetColumn<RateRow>[] = [
  { label: "Code", sortValueOf: ({ code }) => code },
  { label: "Title", sortValueOf: ({ title }) => title || null },
  { label: "Fund", sortValueOf: ({ fundLabel }) => fundLabel },
  { label: "Per" },
  {
    label: "Salary",
    isNumeric: true,
    sortValueOf: ({ salary }) => salary.amount,
  },
  {
    label: "Fringe",
    isNumeric: true,
    sortValueOf: ({ fringeRate }) => fringeRate.amount,
  },
  { label: "Cost per unit", isNumeric: true, sortValueOf: ({ cost }) => cost },
];

const rows = computed(() =>
  rateRowsOf(props.assumptions, props.rateOverrides, props.chargedEmplids),
);

function editRate(row: RateRow, field: RateField, amount: number | null) {
  emit("editRate", {
    rate: { kind: "jobCode", jobCode: row.code, field },
    amount,
  });
}
</script>
