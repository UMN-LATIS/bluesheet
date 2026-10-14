<template>
  <div
    class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-wrap tw-content-start tw-items-start tw-gap-7 tw-overflow-auto tw-px-[18px] tw-py-4"
  >
    <section class="tw-min-w-0 tw-max-w-[340px] tw-flex-[1_1_280px]">
      <CapsLabel class="tw-mb-1.5 tw-block">
        Term defaults · {{ termName }}
      </CapsLabel>
      <div
        class="tw-border-0 tw-border-t tw-border-solid tw-border-outline"
        role="list"
        aria-label="Grad term defaults"
      >
        <div
          v-for="input in view.inputs"
          :key="input.field"
          role="listitem"
          class="tw-grid tw-min-h-11 tw-grid-cols-[minmax(0,1fr)_100px] tw-border-0 tw-border-b tw-border-solid tw-border-surface-container"
        >
          <div
            class="tw-flex tw-min-w-0 tw-flex-col tw-justify-center tw-px-2 tw-py-1"
          >
            <span class="tw-font-semibold">{{ input.label }}</span>
            <span class="tw-text-[11px] tw-text-on-surface-variant">
              {{ input.hint }}
            </span>
          </div>
          <EditableCell
            :kind="input.kind"
            :amount="input.cell.amount"
            :amountWithoutOverride="input.cell.novaAmount"
            :isOverridden="input.cell.isOverridden"
            :canEdit="canEdit"
            placeholder="Not set"
            :label="`${input.label}, ${input.hint}`"
            @change="
              (value) => emit('editInput', { field: input.field, value })
            "
          />
        </div>
      </div>
      <p class="tw-m-0 tw-mt-2 tw-text-[11px] tw-text-on-surface-variant">
        Who gets a fee offset, an international offset or the per-credit payment
        is set on each person's row on the TAs and Instructors tabs. Offsets are
        paid at 50% for appointments under 50%.
      </p>
    </section>

    <section class="tw-min-w-0 tw-flex-[1_1_600px]">
      <CapsLabel class="tw-mb-1.5 tw-block">
        Cost by appointment · {{ termName }}
      </CapsLabel>
      <BudgetTable
        class="tw-min-w-[660px] tw-grid-cols-[72px_80px_96px_88px_96px_100px_88px_100px]"
        label="Grad appointment cost by appointment percent"
        :columns="COLUMNS"
      >
        <template #default>
          <BudgetTableRow
            v-for="appointment in view.appointments"
            :key="appointment.appointmentPercent"
            class="tw-min-h-9 tw-bg-surface-bright"
          >
            <BudgetCell role="cell" class="tw-font-semibold tw-tabular-nums">
              {{ appointment.appointmentPercent }}%
            </BudgetCell>
            <BudgetCell role="cell" class="tw-p-0">
              <EditableCell
                class="tw-w-full"
                kind="hours"
                :amount="appointment.hours.amount"
                :amountWithoutOverride="appointment.hours.novaAmount"
                :isOverridden="appointment.hours.isOverridden"
                :canEdit="canEdit"
                placeholder="Not set"
                :label="`Hours for a ${appointment.appointmentPercent}% appointment`"
                @change="
                  (hours) =>
                    emit('editHours', {
                      appointmentPercent: appointment.appointmentPercent,
                      hours,
                    })
                "
              />
            </BudgetCell>
            <BudgetCell role="cell" align="end">
              <GradCostFigure :dollars="appointment.salary" />
            </BudgetCell>
            <BudgetCell
              role="cell"
              align="end"
              class="tw-text-on-surface-variant"
            >
              <GradCostFigure :dollars="appointment.health" />
            </BudgetCell>
            <BudgetCell
              role="cell"
              align="end"
              class="tw-text-on-surface-variant"
            >
              <GradCostFigure :dollars="appointment.regularTuition" />
            </BudgetCell>
            <BudgetCell role="cell" align="end" class="tw-font-bold">
              <GradCostFigure :dollars="appointment.regularCost" />
            </BudgetCell>
            <BudgetCell
              role="cell"
              align="end"
              class="tw-text-on-surface-variant"
            >
              <GradCostFigure :dollars="appointment.abdTuition" />
            </BudgetCell>
            <BudgetCell
              role="cell"
              align="end"
              :hasRightBorder="false"
              class="tw-font-bold"
            >
              <GradCostFigure :dollars="appointment.abdCost" />
            </BudgetCell>
          </BudgetTableRow>
        </template>
      </BudgetTable>
      <p
        v-if="view.appointments.length === 0"
        class="tw-m-0 tw-mt-2 tw-text-[11px] tw-text-on-surface-variant"
      >
        No appointment levels are entered for this term.
      </p>
      <p class="tw-m-0 tw-mt-2 tw-text-[11px] tw-text-on-surface-variant">
        Salary = hourly rate × hours. Health = GA health × pay. Tuition =
        tuition per hour × hours. Costs here are before any per-person offsets
        or per-credit payment.
      </p>
      <p class="tw-m-0 tw-mt-1 tw-text-[11px] tw-text-on-surface-variant">
        Source: Grad Student Calculator, By Semester. Rates are preliminary
        until approved by the Board of Regents.
      </p>
    </section>
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
import GradCostFigure from "./GradCostFigure.vue";
import type {
  GradHoursEdit,
  GradInputEdit,
  RateOverrides,
} from "../../helpers/costOverrides";
import { gradRatesViewOf } from "../../helpers/rateRows";

const props = defineProps<{
  assumptions: CostAssumptions;
  rateOverrides: RateOverrides;
  canEdit: boolean;
  termName: string;
}>();

const emit = defineEmits<{
  editInput: [edit: GradInputEdit];
  editHours: [edit: GradHoursEdit];
}>();

const COLUMNS: BudgetColumn[] = [
  { label: "Appt" },
  { label: "Hours", isNumeric: true },
  { label: "Salary", isNumeric: true },
  { label: "Health", isNumeric: true },
  { label: "Regular tuition", isNumeric: true },
  { label: "Regular cost", isNumeric: true },
  { label: "ABD tuition", isNumeric: true },
  { label: "ABD cost", isNumeric: true },
];

const view = computed(() =>
  gradRatesViewOf(props.assumptions, props.rateOverrides),
);
</script>
