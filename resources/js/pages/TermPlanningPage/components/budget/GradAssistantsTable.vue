<template>
  <BudgetTable
    label="Grad assistants"
    :columns="COLUMNS"
    :rows="rows"
    class="tw-min-w-[1260px] tw-grid-cols-[minmax(160px,1.2fr)_130px_64px_72px_64px_120px_64px_minmax(120px,1fr)_60px_48px_96px_minmax(140px,1fr)]"
  >
    <template #default="{ rows: shownRows }">
      <PersonTableRow
        v-for="row in shownRows"
        :key="row.emplid ?? 'unstaffed'"
        :emplid="row.emplid"
        class="tw-min-h-11"
        @selectPerson="(emplid) => emit('selectPerson', emplid)"
      >
        <PersonNameCell
          :row="row"
          @selectPerson="(emplid) => emit('selectPerson', emplid)"
          @selectLeave="(leaveId) => emit('selectLeave', leaveId)"
        >
          <CellSubline>{{ row.jobLabel }}</CellSubline>
        </PersonNameCell>

        <BudgetCell role="cell">{{ row.roleLabel }}</BudgetCell>

        <BudgetCell role="cell" class="tw-justify-center">
          <CheckIcon v-if="row.isAbd" role="img" aria-label="ABD" />
        </BudgetCell>

        <BudgetCell role="cell" class="tw-p-0">
          <IntegerInputCell
            :count="row.yearStarted"
            :canEdit="canEdit"
            :label="`Year started for ${row.name}`"
            :min="1950"
            :max="2100"
            @change="(year) => editYearStarted(row, year)"
          />
        </BudgetCell>

        <BudgetCell
          role="cell"
          align="end"
          :class="
            row.isOutsideFundingWindow
              ? 'tw-bg-brand-container tw-font-bold tw-text-brand'
              : ''
          "
        >
          {{ row.fundingYear ?? "—" }}
        </BudgetCell>

        <BudgetCell
          role="cell"
          :class="{ 'tw-text-on-surface-variant': !row.isOwedSupport }"
        >
          {{ row.supportLabel }}
        </BudgetCell>

        <BudgetCell
          role="cell"
          align="end"
          class="tw-font-semibold"
          :class="{ 'tw-bg-brand-container tw-text-brand': row.isUnfunded }"
        >
          {{ row.appointmentPercent ?? 0 }}%
        </BudgetCell>

        <BudgetCell role="cell" class="tw-py-1">
          <SectionLinks
            v-if="row.sections.length > 0"
            :sections="row.sections"
            @select="(sectionId) => emit('selectSection', sectionId)"
          />
          <CellSubline v-else>None this term</CellSubline>
        </BudgetCell>

        <BudgetCell role="cell" class="tw-justify-center">
          <GradCheckbox
            :isChecked="row.hasFeeOffset && !row.isAbd"
            :canEdit="canEdit && !row.isAbd"
            :disabledReason="row.isAbd ? FEE_OFFSET_ABD_REASON : undefined"
            :label="`Student fee offset for ${row.name}`"
            @change="
              (isChecked) => editGradSettings(row, { hasFeeOffset: isChecked })
            "
          />
        </BudgetCell>

        <BudgetCell role="cell" class="tw-justify-center">
          <GradCheckbox
            :isChecked="row.isInternational"
            :canEdit="canEdit"
            :label="`International GA offset for ${row.name}`"
            @change="
              (isChecked) =>
                editGradSettings(row, { isInternational: isChecked })
            "
          />
        </BudgetCell>

        <BudgetCell
          role="cell"
          class="tw-flex-col tw-items-end tw-justify-center tw-tabular-nums"
        >
          <span class="tw-flex tw-items-center tw-gap-1 tw-font-bold">
            <MissingRate v-if="row.hasMissingRate" />
            {{ formatWholeDollars(row.total) }}
          </span>
        </BudgetCell>

        <BudgetCell role="cell" :hasRightBorder="false" class="tw-p-0">
          <TextInputCell
            :value="row.notes"
            :canEdit="canEdit"
            :label="`Notes on ${row.name}`"
            @change="(notes) => editNotes(row, notes)"
          />
        </BudgetCell>
      </PersonTableRow>
    </template>

    <template #totals>
      <SpanningLabelCell :columnCount="7" class="tw-col-span-7 tw-p-2">
        Total · {{ totals.studentCount }} grad students,
        {{ totals.owedSupportCount }} owed dept funding,
        {{ totals.fundedCount }} funded this term
      </SpanningLabelCell>
      <div role="cell" class="tw-col-span-3" />
      <TotalCell role="cell">{{
        formatWholeDollars(totals.totalCost)
      }}</TotalCell>
      <div role="cell" />
    </template>
  </BudgetTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import PersonTableRow from "./PersonTableRow.vue";
import { CheckIcon } from "@/icons";
import CellSubline from "./CellSubline.vue";
import IntegerInputCell from "./IntegerInputCell.vue";
import GradCheckbox from "./GradCheckbox.vue";
import MissingRate from "./MissingRate.vue";
import PersonNameCell from "./PersonNameCell.vue";
import SectionLinks from "./SectionLinks.vue";
import SpanningLabelCell from "./SpanningLabelCell.vue";
import TextInputCell from "./TextInputCell.vue";
import TotalCell from "./TotalCell.vue";
import type { GradPerson } from "@/types";
import {
  gradAssistantTotalsOf,
  type GradAssistantRow,
} from "../../helpers/gradAssistantRows";
import { FEE_OFFSET_ABD_REASON } from "../../helpers/gradCost";
import { formatWholeDollars } from "../../helpers/money";
import { gradPersonEditOf } from "../../helpers/peopleRows";
import type { PersonInputEdit } from "../../helpers/personInputs";

const props = defineProps<{
  rows: GradAssistantRow[];
  canEdit: boolean;
}>();

const emit = defineEmits<{
  selectPerson: [emplid: number];
  selectSection: [sectionId: number];
  selectLeave: [leaveId: number];
  editPersonInput: [edit: PersonInputEdit];
  editGradPerson: [edit: GradPerson];
}>();

const COLUMNS: BudgetColumn<GradAssistantRow>[] = [
  { label: "Name", sortValueOf: ({ name }) => name },
  {
    label: "Role",
    sortValueOf: ({ roleLabel }) => roleLabel,
  },
  { label: "ABD", sortValueOf: ({ isAbd }) => isAbd },
  {
    label: "Started",
    isNumeric: true,
    sortValueOf: ({ yearStarted }) => yearStarted,
  },
  {
    label: "Fund. yr",
    isNumeric: true,
    sortValueOf: ({ fundingYear }) => fundingYear,
  },
  { label: "Support", sortValueOf: ({ supportLabel }) => supportLabel },
  {
    label: "Load",
    isNumeric: true,
    sortValueOf: ({ appointmentPercent }) => appointmentPercent,
  },
  { label: "Sections" },
  { label: "Fee off.", sortValueOf: ({ hasFeeOffset }) => hasFeeOffset },
  { label: "Intl.", sortValueOf: ({ isInternational }) => isInternational },
  { label: "Term cost", isNumeric: true, sortValueOf: ({ total }) => total },
  { label: "Notes" },
];

const totals = computed(() => gradAssistantTotalsOf(props.rows));

function editYearStarted(row: GradAssistantRow, year: number | null) {
  if (row.emplid === null) return;

  emit("editPersonInput", {
    emplid: row.emplid,
    field: "yearStarted",
    value: year,
  });
}

function editNotes(row: GradAssistantRow, notes: string | null) {
  if (row.emplid === null) return;

  emit("editPersonInput", { emplid: row.emplid, field: "notes", value: notes });
}

function editGradSettings(
  row: GradAssistantRow,
  change: Partial<Omit<GradPerson, "emplid">>,
) {
  const edit = gradPersonEditOf(row, change);
  if (edit !== null) emit("editGradPerson", edit);
}
</script>
