<template>
  <BudgetTable
    label="Sections and estimated costs"
    :columns="COLUMNS"
    :rows="rows"
    class="tw-min-w-[1194px] tw-grid-cols-[minmax(170px,1.2fr)_136px_240px_72px_48px_minmax(140px,1fr)_86px_112px_80px_minmax(110px,0.9fr)]"
  >
    <template #default="{ rows: shownRows }">
      <BudgetTableRow
        v-for="row in shownRows"
        :key="row.sectionId"
        class="tw-cursor-pointer hover:tw-bg-surface"
        :class="{
          'tw-bg-primary-container tw-shadow-[inset_3px_0_0_var(--primary)]':
            rowStateOf(row) === 'selected',
          'tw-bg-surface tw-text-on-surface-variant':
            rowStateOf(row) === 'cancelled',
          'tw-bg-accent-container-low': rowStateOf(row) === 'unstaffed',
          'tw-bg-surface-bright': rowStateOf(row) === 'default',
        }"
        @click="emit('select', row.sectionId)"
      >
        <BudgetCell role="cell" class="tw-gap-[7px] tw-py-[5px]">
          <span
            class="tw-w-[3px] tw-flex-none tw-self-stretch tw-rounded-sm"
            :class="colorOfType(row.component).dot"
            aria-hidden="true"
          />
          <span class="tw-min-w-0">
            <span class="tw-block tw-whitespace-nowrap tw-font-semibold">
              <button
                type="button"
                class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-left tw-font-semibold tw-text-on-surface"
                @click.stop="emit('select', row.sectionId)"
              >
                {{ row.courseLabel }}
              </button>
              <CapsLabel class="tw-ml-1">{{ row.component }}</CapsLabel>
            </span>
            <CellSubline>
              {{ row.isCancelled ? "Cancelled" : row.title }}
            </CellSubline>
          </span>
        </BudgetCell>

        <BudgetCell role="cell" class="tw-text-on-surface-variant">
          <span class="tw-truncate" :title="row.meetingSummary">
            {{ row.meetingSummary }}
          </span>
        </BudgetCell>

        <BudgetCell role="cell" class="tw-py-1">
          <EnrollmentTiles :history="row.history" :isReadOnly="isReadOnly" />
        </BudgetCell>

        <BudgetCell role="cell" align="end">{{
          row.enrollmentTotal
        }}</BudgetCell>

        <BudgetCell role="cell" align="end">{{ row.enrollmentCap }}</BudgetCell>

        <BudgetCell role="cell" class="tw-py-[5px]">
          <span class="tw-flex tw-min-w-0 tw-flex-col">
            <span class="tw-flex tw-min-w-0 tw-items-center tw-gap-1">
              <span
                class="tw-truncate"
                :class="{ 'tw-font-semibold tw-text-brand': row.isUnstaffed }"
                :title="row.instructorName"
              >
                {{ row.instructorName }}
              </span>
              <span
                v-if="row.otherInstructorNames.length > 0"
                class="tw-flex-none tw-cursor-help tw-rounded-full tw-bg-surface-container tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-leading-none tw-text-on-surface-variant"
                :title="row.otherInstructorNames.join('; ')"
                :aria-label="`and ${row.otherInstructorNames.length} more: ${row.otherInstructorNames.join('; ')}`"
              >
                +{{ row.otherInstructorNames.length }}
              </span>
            </span>
            <CellSubline v-if="row.instructorJobLabel">
              {{ row.instructorJobLabel }}
            </CellSubline>
          </span>
        </BudgetCell>

        <BudgetCell role="cell" align="end" class="tw-font-semibold">
          <span
            v-if="row.paidElsewhere"
            class="tw-cursor-help tw-text-[11px] tw-font-normal tw-text-on-surface-variant"
            :title="row.paidElsewhere.reason"
          >
            ↳ in {{ row.paidElsewhere.sectionLabel }}
          </span>
          <MissingRate v-else-if="row.instructorCost === null" />
          <template v-else-if="!row.isCancelled">{{
            formatWholeDollars(row.instructorCost)
          }}</template>
        </BudgetCell>

        <BudgetCell
          role="cell"
          :class="{ 'tw-text-on-surface-variant': !row.assistantNames }"
        >
          <span class="tw-truncate" :title="row.assistantNames">
            {{ row.assistantNames || "–" }}
          </span>
        </BudgetCell>

        <BudgetCell
          role="cell"
          align="end"
          class="tw-whitespace-nowrap tw-font-semibold"
        >
          <span
            v-if="row.taCostCell.kind === 'chargedOnOtherSection'"
            class="tw-cursor-help tw-text-[11px] tw-font-normal tw-text-on-surface-variant"
            :title="row.taCostCell.reason"
          >
            ↳ in {{ row.taCostCell.sectionLabel }}
          </span>
          <MissingRate v-else-if="row.taCostCell.kind === 'missingRate'" />
          <template v-else-if="row.taCostCell.kind === 'amount'">{{
            formatWholeDollars(row.taCostCell.dollars)
          }}</template>
        </BudgetCell>

        <BudgetCell
          role="cell"
          :hasRightBorder="false"
          class="tw-p-0"
          @click.stop
        >
          <TextInputCell
            :value="row.notes"
            :canEdit="!isReadOnly"
            :label="`Comments on ${row.courseLabel}`"
            @change="(notes) => emit('editNotes', row.sectionId, notes ?? '')"
          />
        </BudgetCell>
      </BudgetTableRow>
    </template>

    <template #totals>
      <div role="cell" class="tw-whitespace-nowrap tw-p-2">
        Total · {{ rows.length }} sections
      </div>
      <div role="cell" class="tw-col-span-5" />
      <TotalCell role="cell">{{
        formatWholeDollars(totals.instructorCost)
      }}</TotalCell>
      <div role="cell" />
      <TotalCell role="cell">{{ formatWholeDollars(totals.taCost) }}</TotalCell>
      <div role="cell" />
    </template>
  </BudgetTable>
</template>

<script setup lang="ts">
import { colorOfType } from "@/utils/meetingTypeColors";
import BudgetCell from "./BudgetCell.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import CapsLabel from "./CapsLabel.vue";
import CellSubline from "./CellSubline.vue";
import EnrollmentTiles from "./EnrollmentTiles.vue";
import MissingRate from "./MissingRate.vue";
import TextInputCell from "./TextInputCell.vue";
import TotalCell from "./TotalCell.vue";
import type { BudgetRow } from "../../helpers/budgetRows";
import { latestFillOf } from "../../helpers/enrollmentHistory";
import { formatWholeDollars } from "../../helpers/money";
import type { CostTotals } from "../../helpers/termEstimate";

const props = defineProps<{
  rows: BudgetRow[];
  totals: CostTotals;
  selectedSectionId: number | null;
  isReadOnly: boolean;
}>();

const emit = defineEmits<{
  select: [sectionId: number];
  editNotes: [sectionId: number, notes: string];
}>();

const COLUMNS: BudgetColumn<BudgetRow>[] = [
  { label: "Section", sortValueOf: ({ courseLabel }) => courseLabel },
  { label: "Day / time" },
  {
    label: "Prev. enrollment",
    sortValueOf: ({ history }) => latestFillOf(history),
  },
  {
    label: "Enrolled",
    isNumeric: true,
    sortValueOf: ({ enrollmentTotal }) => enrollmentTotal,
  },
  {
    label: "Cap",
    isNumeric: true,
    sortValueOf: ({ enrollmentCap }) => enrollmentCap,
  },
  { label: "Instructor", sortValueOf: ({ instructorName }) => instructorName },
  {
    label: "Instr cost",
    isNumeric: true,
    sortValueOf: ({ instructorCost }) => instructorCost,
  },
  {
    label: "TA support",
    sortValueOf: ({ assistantNames }) => assistantNames || null,
  },
  {
    label: "TA cost",
    isNumeric: true,
    sortValueOf: ({ taCostCell }) =>
      taCostCell.kind === "amount" ? taCostCell.dollars : null,
  },
  { label: "Comments" },
];

type RowState = "selected" | "cancelled" | "unstaffed" | "default";

function rowStateOf(row: BudgetRow): RowState {
  if (row.sectionId === props.selectedSectionId) return "selected";
  if (row.isCancelled) return "cancelled";
  if (row.isUnstaffed) return "unstaffed";
  return "default";
}
</script>
