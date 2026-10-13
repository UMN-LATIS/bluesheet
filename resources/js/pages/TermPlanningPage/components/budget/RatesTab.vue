<template>
  <div
    class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-6 tw-overflow-auto tw-px-[18px] tw-py-4"
  >
    <section>
      <div class="tw-mb-1.5 tw-flex tw-min-h-7 tw-items-end tw-gap-2.5">
        <CapsLabel>
          Instructor rates · per course ·
          {{ fiscalYearLabel(assumptions.fiscalYear) }} rates from Nova ·
          changes apply to {{ termName }}
        </CapsLabel>
        <ResetAllButton
          v-if="canEdit && jobCodeRows.some(isOverridden)"
          @click="resetAll(jobCodeRows)"
        />
      </div>
      <div
        class="tw-grid tw-grid-cols-[72px_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.6fr)_120px_32px_minmax(0,1.8fr)] [&>*]:tw-py-1 tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-text-xs"
      >
        <ColumnHeading v-for="heading in JOB_CODE_HEADINGS" :key="heading">
          {{ heading }}
        </ColumnHeading>
        <template v-for="row in jobCodeRows" :key="row.code">
          <BudgetCell :hasRightBorder="false" class="tw-font-semibold">
            {{ row.codeLabel }}
          </BudgetCell>
          <BudgetCell :hasRightBorder="false">
            {{ row.title }}
          </BudgetCell>
          <BudgetCell
            :hasRightBorder="false"
            class="tw-text-on-surface-variant"
          >
            {{ row.instructorTypeLabel }}
          </BudgetCell>
          <BudgetCell
            :hasRightBorder="false"
            class="tw-text-on-surface-variant"
          >
            {{ row.fundLabel }}
          </BudgetCell>
          <BudgetCell :hasRightBorder="false">
            <DollarInput
              class="tw-w-full"
              :amount="row.amount"
              :isOverridden="row.isOverriddenForTerm"
              :isDisabled="!canEdit"
              :label="`Rate for ${row.code} ${row.title}`"
              @change="(amount) => editRate(row, amount)"
            />
          </BudgetCell>
          <BudgetCell :hasRightBorder="false" class="tw-justify-center tw-px-0">
            <ResetButton
              v-if="canEdit && row.isOverriddenForTerm"
              :label="`Reset to ${novaRateLabelOf(row)}`"
              @reset="editRate(row, null)"
            />
          </BudgetCell>
          <BudgetCell
            :hasRightBorder="false"
            class="tw-text-[11.5px] tw-text-on-surface-variant"
          >
            {{ row.source }}
          </BudgetCell>
        </template>
      </div>
    </section>

    <section class="tw-max-w-[720px]">
      <div class="tw-mb-1.5 tw-flex tw-min-h-7 tw-items-end tw-gap-2.5">
        <CapsLabel>
          TA appointments · {{ assumptions.season }} · per term, salary + fringe
          <template v-if="assumptions.taRates.fiscalYear !== null">
            · {{ fiscalYearLabel(assumptions.taRates.fiscalYear) }}
          </template>
        </CapsLabel>
        <ResetAllButton
          v-if="canEdit && taCells.some(isOverridden)"
          @click="resetAll(taCells)"
        />
      </div>
      <p
        v-if="taRows.length === 0"
        class="tw-m-0 tw-text-[11.5px] tw-text-on-surface-variant"
      >
        No TA rates are entered for {{ assumptions.season }} at or before
        {{ fiscalYearLabel(assumptions.fiscalYear) }}. TA lines show "No rate".
      </p>
      <template v-else>
        <div
          class="tw-grid tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_32px_120px_32px] [&>*]:tw-py-1 tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-text-xs"
        >
          <ColumnHeading>Appointment</ColumnHeading>
          <ColumnHeading>Hours</ColumnHeading>
          <ColumnHeading class="tw-col-span-2">Regular</ColumnHeading>
          <ColumnHeading class="tw-col-span-2">ABD</ColumnHeading>
          <template v-for="row in taRows" :key="row.appointmentPercent">
            <BudgetCell :hasRightBorder="false" class="tw-font-semibold">
              {{ row.appointmentPercent }}% appointment
            </BudgetCell>
            <BudgetCell
              :hasRightBorder="false"
              class="tw-text-on-surface-variant"
            >
              {{ row.hoursPerTerm }} hrs / term
            </BudgetCell>
            <template v-for="status in STUDENT_STATUSES" :key="status">
              <BudgetCell :hasRightBorder="false">
                <DollarInput
                  class="tw-w-full"
                  :amount="row.cells[status].amount"
                  :isOverridden="row.cells[status].isOverriddenForTerm"
                  :isDisabled="!canEdit"
                  :label="`${row.appointmentPercent}% ${STATUS_LABELS[status]} TA rate`"
                  @change="(amount) => editRate(row.cells[status], amount)"
                />
              </BudgetCell>
              <BudgetCell
                :hasRightBorder="false"
                class="tw-justify-center tw-px-0"
              >
                <ResetButton
                  v-if="canEdit && row.cells[status].isOverriddenForTerm"
                  :label="`Reset to ${novaRateLabelOf(row.cells[status])}`"
                  @reset="editRate(row.cells[status], null)"
                />
              </BudgetCell>
            </template>
          </template>
        </div>
        <p
          class="tw-mb-0 tw-mt-2.5 tw-text-[11.5px] tw-leading-normal tw-text-on-surface-variant"
        >
          Each TA costs one {{ TA_APPOINTMENT_PERCENT }}% appointment per
          course, at the ABD rate when Nova marks their job code ABD. For
          another appointment, change the TA's cost on the Sections tab.
        </p>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CostAssumptions, StudentStatus } from "@/types";
import BudgetCell from "./BudgetCell.vue";
import CapsLabel from "./CapsLabel.vue";
import ColumnHeading from "./ColumnHeading.vue";
import DollarInput from "./DollarInput.vue";
import ResetAllButton from "./ResetAllButton.vue";
import ResetButton from "./ResetButton.vue";
import type {
  RateOverrideEdit,
  RateOverrides,
} from "../../helpers/costOverrides";
import { TA_APPOINTMENT_PERCENT } from "../../helpers/costRules";
import { fiscalYearLabel } from "../../helpers/fiscalYear";
import { formatWholeDollars } from "../../helpers/money";
import {
  jobCodeRateRowsOf,
  taRateRowsOf,
  type RateCell,
} from "../../helpers/rateRows";

const props = defineProps<{
  assumptions: CostAssumptions;
  rateOverrides: RateOverrides;
  canEdit: boolean;
  instructorEmplids: Set<number>;
  termName: string;
}>();

const emit = defineEmits<{ editRate: [edit: RateOverrideEdit] }>();

const JOB_CODE_HEADINGS = [
  "Code",
  "Title",
  "Type",
  "Fund",
  "Rate",
  "",
  "Source",
];
const STUDENT_STATUSES: StudentStatus[] = ["regular", "abd"];
const STATUS_LABELS: Record<StudentStatus, string> = {
  regular: "regular",
  abd: "ABD",
};

const jobCodeRows = computed(() =>
  jobCodeRateRowsOf(
    props.assumptions,
    props.rateOverrides,
    props.instructorEmplids,
    props.termName,
  ),
);

const taRows = computed(() =>
  taRateRowsOf(props.assumptions, props.rateOverrides),
);

const taCells = computed(() =>
  taRows.value.flatMap(({ cells }) => [cells.regular, cells.abd]),
);

const isOverridden = ({ isOverriddenForTerm }: RateCell) => isOverriddenForTerm;

const novaRateLabelOf = ({ novaAmount }: RateCell) =>
  novaAmount === null ? "no rate" : formatWholeDollars(novaAmount);

function editRate(cell: RateCell, amount: number | null) {
  const isNovaRate = amount === null || amount === cell.novaAmount;
  emit("editRate", { rate: cell.rate, amount: isNovaRate ? null : amount });
}

function resetAll(cells: RateCell[]) {
  cells.filter(isOverridden).forEach((cell) => editRate(cell, null));
}
</script>
