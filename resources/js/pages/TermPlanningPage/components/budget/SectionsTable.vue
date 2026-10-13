<template>
  <div class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto">
    <div
      role="table"
      aria-label="Sections and estimated costs"
      class="tw-min-w-[1068px] tw-text-xs"
    >
      <div
        role="row"
        class="tw-sticky tw-top-0 tw-z-[2] tw-grid tw-border-0 tw-border-b tw-border-solid tw-border-outline tw-bg-surface-bright"
        :style="{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }"
      >
        <CapsLabel
          v-for="column in HEADINGS"
          :key="column.label"
          role="columnheader"
          class="tw-overflow-hidden tw-whitespace-nowrap tw-border-0 tw-border-r tw-border-solid tw-border-surface-container tw-px-2 tw-py-[7px]"
          :class="{ 'tw-text-right': column.isNumeric }"
        >
          {{ column.label }}
        </CapsLabel>
      </div>

      <div
        v-for="row in rows"
        :key="row.sectionId"
        role="row"
        class="tw-grid tw-cursor-pointer hover:tw-bg-surface"
        :class="{
          'tw-bg-primary-container tw-shadow-[inset_3px_0_0_var(--primary)]':
            rowStateOf(row) === 'selected',
          'tw-bg-surface tw-text-on-surface-variant':
            rowStateOf(row) === 'cancelled',
          'tw-bg-accent-container-low': rowStateOf(row) === 'unstaffed',
          'tw-bg-surface-bright': rowStateOf(row) === 'default',
        }"
        :style="{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }"
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
          <EnrollmentTiles :history="row.history" />
        </BudgetCell>

        <BudgetCell role="cell" align="end">{{ row.enrollmentCap }}</BudgetCell>

        <BudgetCell role="cell" class="tw-py-[5px]">
          <span class="tw-min-w-0">
            <span
              class="tw-block tw-truncate"
              :class="{ 'tw-font-semibold tw-text-brand': row.isUnstaffed }"
              :title="row.instructorName"
            >
              {{ row.instructorName }}
            </span>
            <CellSubline
              v-if="row.instructorSubline"
              :title="row.instructorSubline"
            >
              {{ row.instructorSubline }}
            </CellSubline>
          </span>
        </BudgetCell>

        <BudgetCell
          role="cell"
          class="tw-px-0 tw-font-semibold"
          :class="{ 'tw-bg-accent-container-low': row.hasInstructorOverride }"
        >
          <CostOverrideCell
            v-if="!row.isCancelled"
            :lines="row.instructorLines"
            :isOverridden="row.hasInstructorOverride"
            :canEdit="canEditCosts"
            :courseLabel="row.courseLabel"
            costLabel="Instructor cost"
            :basisLabel="row.instructorBasisLabel"
            @editLine="(edit) => emit('editLine', edit)"
          >
            <span
              v-if="row.paidOnLectureLabel"
              class="tw-text-[11px] tw-font-normal tw-text-on-surface-variant"
            >
              ↳ in {{ row.paidOnLectureLabel }}
            </span>
            <MissingRate v-else-if="row.instructorCost === null" />
            <template v-else>{{
              formatWholeDollars(row.instructorCost)
            }}</template>
          </CostOverrideCell>
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
          class="tw-whitespace-nowrap"
          :class="{
            'tw-px-0 tw-font-semibold': row.taLines.length > 0,
            'tw-bg-accent-container-low': row.hasTaOverride,
          }"
          :title="row.taBasisLabel"
        >
          <span
            v-if="row.taCostCell.kind === 'chargedOnOtherSection'"
            class="tw-text-[11px] tw-text-on-surface-variant"
          >
            ↳ in {{ row.taCostCell.sectionLabel }}
          </span>
          <CostOverrideCell
            v-else-if="row.taLines.length > 0"
            :lines="row.taLines"
            :isOverridden="row.hasTaOverride"
            :canEdit="canEditCosts"
            :courseLabel="row.courseLabel"
            costLabel="TA cost"
            :basisLabel="row.taBasisLabel"
            @editLine="(edit) => emit('editLine', edit)"
          >
            <MissingRate v-if="row.taCostCell.kind === 'missingRate'" />
            <template v-else-if="row.taCostCell.kind === 'amount'">{{
              formatWholeDollars(row.taCostCell.dollars)
            }}</template>
          </CostOverrideCell>
        </BudgetCell>

        <BudgetCell
          role="cell"
          :hasRightBorder="false"
          class="tw-p-0"
          @click.stop
        >
          <input
            :value="row.notes"
            :disabled="isReadOnly"
            :aria-label="`Comments on ${row.courseLabel}`"
            class="tw-h-full tw-min-h-10 tw-w-full tw-border-none tw-bg-transparent tw-px-2 tw-text-[11.5px] tw-text-on-surface tw-outline-none focus:tw-bg-surface-bright disabled:tw-cursor-default"
            @input="onNotesInput(row.sectionId, $event)"
          />
        </BudgetCell>
      </div>

      <div
        role="row"
        class="tw-sticky tw-bottom-0 tw-grid tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-bg-surface tw-font-bold"
        :style="{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }"
      >
        <div role="cell" class="tw-col-span-5 tw-p-2">
          Total · {{ rows.length }} sections
        </div>
        <TotalCell role="cell">{{
          formatWholeDollars(totals.instructorCost)
        }}</TotalCell>
        <div role="cell" />
        <TotalCell role="cell">{{
          formatWholeDollars(totals.taCost)
        }}</TotalCell>
        <div role="cell" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { colorOfType } from "@/utils/meetingTypeColors";
import BudgetCell from "./BudgetCell.vue";
import CapsLabel from "./CapsLabel.vue";
import CellSubline from "./CellSubline.vue";
import CostOverrideCell from "./CostOverrideCell.vue";
import EnrollmentTiles from "./EnrollmentTiles.vue";
import MissingRate from "./MissingRate.vue";
import TotalCell from "./TotalCell.vue";
import type { BudgetRow } from "../../helpers/budgetRows";
import type { LineOverrideEdit } from "../../helpers/costOverrides";
import { formatWholeDollars } from "../../helpers/money";
import type { CostTotals } from "../../helpers/termEstimate";

const props = defineProps<{
  rows: BudgetRow[];
  totals: CostTotals;
  selectedSectionId: number | null;
  isReadOnly: boolean;
  canEditCosts: boolean;
}>();

const emit = defineEmits<{
  select: [sectionId: number];
  editNotes: [sectionId: number, notes: string];
  editLine: [edit: LineOverrideEdit];
}>();

const GRID_TEMPLATE_COLUMNS =
  "minmax(170px,1.2fr) 136px 196px 48px minmax(140px,1fr) 86px 112px 80px minmax(110px,0.9fr)";

const HEADINGS = [
  { label: "Section", isNumeric: false },
  { label: "Day / time", isNumeric: false },
  { label: "Prev. enrollment", isNumeric: false },
  { label: "Cap", isNumeric: true },
  { label: "Instructor", isNumeric: false },
  { label: "Est. cost", isNumeric: true },
  { label: "TA support", isNumeric: false },
  { label: "TA cost", isNumeric: true },
  { label: "Comments", isNumeric: false },
];

type RowState = "selected" | "cancelled" | "unstaffed" | "default";

function rowStateOf(row: BudgetRow): RowState {
  if (row.sectionId === props.selectedSectionId) return "selected";
  if (row.isCancelled) return "cancelled";
  if (row.isUnstaffed) return "unstaffed";
  return "default";
}

function onNotesInput(sectionId: number, event: Event) {
  emit("editNotes", sectionId, (event.target as HTMLInputElement).value);
}
</script>
