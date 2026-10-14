<template>
  <div
    class="scrollbar-always-visible tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-6 tw-overflow-auto tw-px-[18px] tw-py-4"
  >
    <section class="tw-max-w-[940px] tw-flex-none">
      <CapsLabel class="tw-mb-1.5 tw-block">
        Salaried job codes · {{ termName }}
      </CapsLabel>
      <BudgetTable
        class="tw-min-w-[720px] tw-grid-cols-[72px_minmax(0,1fr)_84px_112px_120px_120px_120px]"
        label="Salaried job code rates"
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
              <span class="tw-truncate" :title="row.title">{{
                row.title
              }}</span>
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
    </section>

    <section class="tw-max-w-[940px] tw-flex-none">
      <CapsLabel class="tw-mb-1.5 tw-block">
        Grad students · {{ termName }}
      </CapsLabel>
      <div
        class="tw-mb-2 tw-flex tw-flex-col tw-gap-2.5 tw-rounded-[10px] tw-bg-surface tw-p-3"
      >
        <div
          class="tw-grid tw-grid-cols-[repeat(auto-fill,minmax(150px,1fr))] tw-gap-2"
        >
          <InputTile
            v-for="input in grad.inputs"
            :key="input.field"
            :label="input.label"
          >
            <EditableCell
              :kind="input.kind"
              :amount="input.cell.amount"
              :amountWithoutOverride="input.cell.novaAmount"
              :isOverridden="input.cell.isOverridden"
              :canEdit="canEdit"
              placeholder="Not set"
              :label="input.label"
              @change="
                (value) => emit('editGradInput', { field: input.field, value })
              "
            />
          </InputTile>
          <InputTile label="Appointment per section">
            <AppointmentSelect
              :appointmentPercent="grad.defaultAppointmentPercent"
              :levels="appointmentLevels"
              :defaultPercent="STANDARD_APPOINTMENT_PERCENT"
              :isOverridden="grad.isDefaultAppointmentOverridden"
              :canEdit="canEdit"
              label="Appointment per section"
              @change="
                (value) =>
                  emit('editGradInput', {
                    field: 'defaultAppointmentPercent',
                    value,
                  })
              "
            />
          </InputTile>
        </div>
        <div
          v-if="grad.hours.length > 0"
          class="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5"
        >
          <span class="tw-text-[11px] tw-text-on-surface-variant">
            Hours per term at
          </span>
          <span
            v-for="level in grad.hours"
            :key="level.appointmentPercent"
            class="tw-flex tw-items-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
          >
            <span
              class="tw-pl-2 tw-text-[11px] tw-font-semibold tw-text-on-surface-variant"
            >
              {{ level.appointmentPercent }}%
            </span>
            <EditableCell
              class="tw-w-16"
              kind="hours"
              :amount="level.hours.amount"
              :amountWithoutOverride="level.hours.novaAmount"
              :isOverridden="level.hours.isOverridden"
              :canEdit="canEdit"
              placeholder="Not set"
              :label="`Hours per term at a ${level.appointmentPercent}% appointment`"
              @change="
                (hours) =>
                  emit('editGradHours', {
                    appointmentPercent: level.appointmentPercent,
                    hours,
                  })
              "
            />
          </span>
        </div>
      </div>

      <BudgetTable
        class="tw-min-w-[720px] tw-grid-cols-[72px_minmax(0,1fr)_84px_112px_120px_120px_120px]"
        label="Grad job code costs"
        :columns="GRAD_COLUMNS"
        :rows="grad.rows"
      >
        <template #default="{ rows: shownRows }">
          <BudgetTableRow
            v-for="row in shownRows"
            :key="row.code"
            class="tw-min-h-11 tw-bg-surface-bright"
          >
            <BudgetCell role="cell" class="tw-font-semibold tw-tabular-nums">
              {{ row.code }}
            </BudgetCell>
            <BudgetCell role="cell">
              <span class="tw-min-w-0">
                <span class="tw-block tw-truncate" :title="row.title">
                  {{ row.title }}
                </span>
                <CellSubline>{{ row.isAbd ? "ABD" : "Regular" }}</CellSubline>
              </span>
            </BudgetCell>
            <BudgetCell role="cell" class="tw-text-on-surface-variant">
              {{ row.fundLabel }}
            </BudgetCell>
            <BudgetCell role="cell" class="tw-text-on-surface-variant">
              <span class="tw-min-w-0">
                <span class="tw-block">Section</span>
                <CellSubline>
                  {{ grad.defaultAppointmentPercent }}%<template
                    v-if="row.cost"
                  >
                    · {{ row.cost.hours }} hrs</template
                  >
                </CellSubline>
              </span>
            </BudgetCell>
            <BudgetCell role="cell" align="end">
              <DerivedFigure :dollars="row.cost?.pay ?? null">
                <template v-if="row.cost">
                  {{ formatDollars(row.cost.inputs.hourlyRate) }} ×
                  {{ row.cost.hours }} hrs
                </template>
              </DerivedFigure>
            </BudgetCell>
            <BudgetCell role="cell" align="end">
              <DerivedFigure :dollars="row.cost?.fringe ?? null">
                <template v-if="row.cost">
                  {{ formatPercent(row.cost.inputs.healthRate) }} +
                  {{ formatDollars(row.cost.tuitionPerHour) }}/hr
                </template>
              </DerivedFigure>
            </BudgetCell>
            <BudgetCell
              role="cell"
              align="end"
              :hasRightBorder="false"
              class="tw-font-semibold"
            >
              <DerivedFigure :dollars="row.cost?.total ?? null">
                <template v-if="row.cost && row.isGradInstructor">
                  + {{ formatDollars(row.cost.inputs.perCreditPayment) }} per
                  credit
                </template>
              </DerivedFigure>
            </BudgetCell>
          </BudgetTableRow>
        </template>
      </BudgetTable>
      <p class="tw-m-0 tw-mt-2 tw-text-[11px] tw-text-on-surface-variant">
        Each section a grad student is paid on adds this appointment, up to 50%,
        unless their own appointment is set. Offsets are paid per person: a
        quarter under a 25% appointment, half under 50%, and in full from 50%.
        ABD codes get no fee offset.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CostAssumptions } from "@/types";
import BudgetCell from "./BudgetCell.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import AppointmentSelect from "./AppointmentSelect.vue";
import CapsLabel from "./CapsLabel.vue";
import CellSubline from "./CellSubline.vue";
import DerivedFigure from "./DerivedFigure.vue";
import EditableCell from "./EditableCell.vue";
import InputTile from "./InputTile.vue";
import MissingRate from "./MissingRate.vue";
import type {
  GradHoursEdit,
  GradInputEdit,
  RateField,
  RateOverrideEdit,
  RateOverrides,
} from "../../helpers/costOverrides";
import { STANDARD_APPOINTMENT_PERCENT } from "../../helpers/gradCost";
import { formatDollars } from "../../helpers/money";
import { formatPercent } from "../../helpers/percentAmounts";
import {
  gradRatesOf,
  rateRowsOf,
  type GradRateRow,
  type RateRow,
} from "../../helpers/rateRows";

const props = defineProps<{
  assumptions: CostAssumptions;
  rateOverrides: RateOverrides;
  canEdit: boolean;
  chargedEmplids: Set<number>;
  /** The term's appointment percents. */
  appointmentLevels: number[];
  termName: string;
}>();

const emit = defineEmits<{
  editRate: [edit: RateOverrideEdit];
  editGradInput: [edit: GradInputEdit];
  editGradHours: [edit: GradHoursEdit];
}>();

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

const GRAD_COLUMNS: BudgetColumn<GradRateRow>[] = [
  { label: "Code", sortValueOf: ({ code }) => code },
  { label: "Title", sortValueOf: ({ title }) => title || null },
  { label: "Fund" },
  { label: "Per" },
  {
    label: "Salary",
    isNumeric: true,
    sortValueOf: ({ cost }) => cost?.pay ?? null,
  },
  {
    label: "Fringe",
    isNumeric: true,
    sortValueOf: ({ cost }) => cost?.fringe ?? null,
  },
  {
    label: "Cost per unit",
    isNumeric: true,
    sortValueOf: ({ cost }) => cost?.total ?? null,
  },
];

const rows = computed(() =>
  rateRowsOf(props.assumptions, props.rateOverrides, props.chargedEmplids),
);

const grad = computed(() =>
  gradRatesOf(props.assumptions, props.rateOverrides),
);

function editRate(row: RateRow, field: RateField, amount: number | null) {
  emit("editRate", {
    rate: { kind: "jobCode", jobCode: row.code, field },
    amount,
  });
}
</script>
