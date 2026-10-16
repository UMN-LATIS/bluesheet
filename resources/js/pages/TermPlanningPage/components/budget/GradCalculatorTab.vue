<template>
  <div
    class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto tw-px-[18px] tw-py-4"
  >
    <section class="tw-max-w-[1100px]">
      <div class="tw-mb-1.5 tw-flex tw-items-baseline tw-gap-3">
        <CapsLabel>Estimated rates · {{ termName }}</CapsLabel>
        <AdminRatesLink novaResourceUriKey="grad-term-rates" />
      </div>

      <div
        class="tw-mb-2 tw-flex tw-flex-col tw-gap-2.5 tw-rounded-[10px] tw-bg-surface tw-p-3"
      >
        <div
          class="tw-grid tw-grid-cols-[repeat(auto-fill,minmax(150px,1fr))] tw-gap-2"
        >
          <div
            v-for="input in calculator.inputs"
            :key="input.label"
            class="tw-flex tw-min-w-0 tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
          >
            <span
              class="tw-px-2 tw-pt-1.5 tw-text-[11px] tw-leading-4 tw-text-on-surface-variant"
            >
              {{ input.label }}
            </span>
            <span
              class="tw-min-h-8 tw-px-2 tw-py-1.5 tw-text-right tw-text-xs tw-font-semibold tw-tabular-nums"
            >
              {{ input.text }}
            </span>
          </div>
        </div>

        <div
          class="tw-flex tw-flex-wrap tw-items-center tw-gap-x-[18px] tw-gap-y-1.5 tw-text-xs"
        >
          <span class="tw-text-[11px] tw-text-on-surface-variant">
            Scenario
          </span>
          <label
            class="tw-m-0 tw-flex tw-cursor-pointer tw-items-center tw-gap-1.5"
          >
            <GradCheckbox
              :isChecked="scenario.hasFeeOffset"
              :canEdit="true"
              label="Student fee offset eligible"
              @change="
                (isChecked) =>
                  emit('editGradScenario', { hasFeeOffset: isChecked })
              "
            />
            Student fee offset eligible
          </label>
          <label
            class="tw-m-0 tw-flex tw-cursor-pointer tw-items-center tw-gap-1.5"
          >
            <GradCheckbox
              :isChecked="scenario.isInternational"
              :canEdit="true"
              label="International GA"
              @change="
                (isChecked) =>
                  emit('editGradScenario', { isInternational: isChecked })
              "
            />
            International GA
          </label>
          <span class="tw-flex tw-items-center tw-gap-1.5">
            Credits taught (9515/9517 only)
            <span
              class="tw-flex tw-w-14 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
            >
              <IntegerInputCell
                :count="scenario.creditsTaught"
                :canEdit="true"
                label="Credits taught"
                :min="0"
                :max="MAX_CREDITS"
                @change="
                  (credits) =>
                    emit('editGradScenario', { creditsTaught: credits ?? 0 })
                "
              />
            </span>
          </span>
        </div>
      </div>

      <BudgetTable
        label="Grad salary and fringe"
        :columns="COLUMNS"
        :rows="calculator.groups"
        class="tw-min-w-[980px] tw-grid-cols-[72px_64px_64px_repeat(9,minmax(0,1fr))]"
      >
        <template #default="{ rows: groups }">
          <template v-for="group in groups" :key="group.label">
            <BudgetTableRow class="tw-bg-surface">
              <div
                role="cell"
                class="tw-col-span-full tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-px-2 tw-py-1.5"
              >
                <CapsLabel>{{ group.label }}</CapsLabel>
              </div>
            </BudgetTableRow>
            <BudgetTableRow
              v-for="row in group.rows"
              :key="`${group.label}-${row.appointmentPercent}`"
              class="tw-min-h-9 tw-bg-surface-bright"
            >
              <BudgetCell role="cell" class="tw-text-on-surface-variant">
                {{ group.label }}
              </BudgetCell>
              <BudgetCell role="cell" align="end" class="tw-font-semibold">
                {{ row.appointmentPercent }}%
              </BudgetCell>
              <BudgetCell
                role="cell"
                align="end"
                class="tw-text-on-surface-variant"
              >
                {{ row.hours }}
              </BudgetCell>
              <BudgetCell role="cell" align="end">
                {{ formatDollarsAndCents(row.base) }}
              </BudgetCell>
              <BudgetCell
                role="cell"
                align="end"
                :class="{
                  'tw-text-on-surface-variant': row.feeOffset === null,
                }"
              >
                {{
                  row.feeOffset === null
                    ? "N/A"
                    : formatDollarsAndCents(row.feeOffset)
                }}
              </BudgetCell>
              <BudgetCell role="cell" align="end">
                {{ formatDollarsAndCents(row.internationalOffset) }}
              </BudgetCell>
              <BudgetCell role="cell" align="end">
                {{ formatDollarsAndCents(row.instructorPay) }}
              </BudgetCell>
              <BudgetCell
                role="cell"
                align="end"
                class="tw-bg-surface tw-font-semibold"
              >
                {{ formatDollarsAndCents(row.pay) }}
              </BudgetCell>
              <BudgetCell role="cell" align="end">
                {{ formatDollarsAndCents(row.health) }}
              </BudgetCell>
              <BudgetCell role="cell" align="end">
                {{ formatDollarsAndCents(row.tuition) }}
              </BudgetCell>
              <BudgetCell
                role="cell"
                align="end"
                class="tw-bg-surface tw-font-semibold"
              >
                {{ formatDollarsAndCents(row.fringe) }}
              </BudgetCell>
              <BudgetCell
                role="cell"
                align="end"
                :hasRightBorder="false"
                class="tw-font-bold"
              >
                {{ formatDollarsAndCents(row.total) }}
              </BudgetCell>
            </BudgetTableRow>
          </template>
        </template>
      </BudgetTable>

      <p
        class="tw-m-0 tw-mt-2 tw-max-w-[760px] tw-text-[11px] tw-leading-4 tw-text-on-surface-variant"
      >
        Offsets are paid at a quarter below a 25% appointment, half from 25% up
        to 50%, and in full from 50%. For concurrent appointments, the sum of
        the appointments sets the payment. ABD job codes are ineligible for the
        student fee offset. Grad instructor pay per credit applies to 9515/9517
        only. Every grad cost on the other tabs is read from this table.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import AdminRatesLink from "./AdminRatesLink.vue";
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import CapsLabel from "./CapsLabel.vue";
import IntegerInputCell from "./IntegerInputCell.vue";
import GradCheckbox from "./GradCheckbox.vue";
import type {
  GradCalculator,
  GradCalculatorGroup,
} from "../../helpers/gradCalculatorRows";
import { formatDollarsAndCents } from "../../helpers/money";
import type { GradScenario } from "../../useScheduleEditor/types";

defineProps<{
  calculator: GradCalculator;
  scenario: GradScenario;
  termName: string;
}>();

const emit = defineEmits<{
  editGradScenario: [change: Partial<GradScenario>];
}>();

const MAX_CREDITS = 40;

const COLUMNS: BudgetColumn<GradCalculatorGroup>[] = [
  { label: "Status" },
  { label: "% Appt", isNumeric: true },
  { label: "Hours", isNumeric: true },
  { label: "Base", isNumeric: true },
  { label: "Fee offset", isNumeric: true },
  { label: "Intl offset", isNumeric: true },
  { label: "GI pay", isNumeric: true },
  { label: "Salary", isNumeric: true },
  { label: "Health", isNumeric: true },
  { label: "Tuition", isNumeric: true },
  { label: "Fringe", isNumeric: true },
  { label: "Total", isNumeric: true },
];
</script>
