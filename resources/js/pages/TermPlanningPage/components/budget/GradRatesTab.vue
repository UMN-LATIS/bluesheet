<template>
  <div class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-px-[18px] tw-py-4">
    <CapsLabel class="tw-mb-1.5 tw-block">
      Grad Rates · {{ termName }}
    </CapsLabel>
    <BudgetTable
      class="tw-min-w-[802px] tw-max-w-[960px] tw-grid-cols-[72px_minmax(0,1fr)_84px_120px_96px_110px_110px_110px]"
      label="Grad rates"
      :columns="columns"
    >
      <template #default>
        <BudgetTableRow
          v-for="row in rows"
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
            {{ row.perLabel }}
          </BudgetCell>
          <BudgetCell role="cell" class="tw-p-0">
            <EditableCell
              class="tw-w-full"
              kind="dollars"
              :amount="row.salary.amount"
              :amountWithoutOverride="row.salary.novaAmount"
              :isOverridden="row.salary.isOverridden"
              :canEdit="canEdit"
              :label="`Salary for ${row.code} ${row.title}`"
              @change="(amount) => editRate(row, 'salary', amount)"
            />
          </BudgetCell>
          <BudgetCell role="cell" class="tw-p-0">
            <EditableCell
              class="tw-w-full"
              kind="percent"
              :amount="row.fringeRate.amount"
              :amountWithoutOverride="row.fringeRate.novaAmount"
              :isOverridden="row.fringeRate.isOverridden"
              :canEdit="canEdit"
              :label="`Fringe for ${row.code} ${row.title}`"
              @change="(amount) => editRate(row, 'fringeRate', amount)"
            />
          </BudgetCell>
          <BudgetCell
            v-for="appointment in row.costByAppointmentPercent"
            :key="appointment.percent"
            role="cell"
            align="end"
            :hasRightBorder="appointment.percent !== lastPercent"
            class="tw-font-semibold"
          >
            <MissingRate v-if="appointment.cost === null" />
            <template v-else>{{ formatDollars(appointment.cost) }}</template>
          </BudgetCell>
        </BudgetTableRow>
      </template>
    </BudgetTable>
    <p
      class="tw-m-0 tw-mt-3 tw-max-w-[960px] tw-text-[11px] tw-text-on-surface-variant"
    >
      Salary is a 25% appointment for this term (hours × hourly rate). Fringe is
      GA health % plus tuition per hour ÷ hourly rate, from the Grad Student
      Calculator. A grad student's appointment is 25% for each course they
      support.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CostAssumptions } from "@/types";
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import CapsLabel from "./CapsLabel.vue";
import EditableCell from "./EditableCell.vue";
import MissingRate from "./MissingRate.vue";
import type {
  RateField,
  RateOverrideEdit,
  RateOverrides,
} from "../../helpers/costOverrides";
import { formatDollars } from "../../helpers/money";
import {
  GRAD_APPOINTMENT_PERCENTS,
  gradRateRowsOf,
  type RateRow,
} from "../../helpers/rateRows";

const props = defineProps<{
  assumptions: CostAssumptions;
  rateOverrides: RateOverrides;
  canEdit: boolean;
  termName: string;
}>();

const emit = defineEmits<{ editRate: [edit: RateOverrideEdit] }>();

const lastPercent =
  GRAD_APPOINTMENT_PERCENTS[GRAD_APPOINTMENT_PERCENTS.length - 1];

const columns: BudgetColumn[] = [
  { label: "Code" },
  { label: "Title" },
  { label: "Per" },
  { label: "Salary", isNumeric: true },
  { label: "Fringe", isNumeric: true },
  ...GRAD_APPOINTMENT_PERCENTS.map((percent) => ({
    label: `Cost at ${percent}%`,
    isNumeric: true,
  })),
];

const rows = computed(() =>
  gradRateRowsOf(props.assumptions, props.rateOverrides),
);

function editRate(row: RateRow, field: RateField, amount: number | null) {
  emit("editRate", {
    rate: { kind: "jobCode", jobCode: row.code, field },
    amount,
  });
}
</script>
