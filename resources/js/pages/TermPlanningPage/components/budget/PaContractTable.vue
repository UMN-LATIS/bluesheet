<template>
  <BudgetTable
    label="P&A and contract faculty"
    :columns="COLUMNS"
    :rows="rows"
    :collapsedGroup="UNASSIGNED_GROUP"
    class="tw-min-w-[1000px] tw-grid-cols-[minmax(160px,1.1fr)_132px_minmax(150px,1fr)_80px_80px_96px_minmax(140px,1fr)]"
  >
    <template #default="{ rows: shownRows }">
      <BudgetTableRow
        v-for="row in shownRows"
        :key="row.emplid"
        class="tw-min-h-11 tw-bg-surface-bright"
      >
        <PersonNameCell
          :row="row"
          @selectPerson="(emplid) => emit('selectPerson', emplid)"
          @selectLeave="(leaveId) => emit('selectLeave', leaveId)"
        >
          <CellSubline>{{ row.jobCode }} · {{ row.title }}</CellSubline>
        </PersonNameCell>
        <BudgetCell role="cell">{{ row.typeLabel }}</BudgetCell>
        <BudgetCell role="cell" class="tw-py-1">
          <SectionLinks
            :sections="row.sections"
            @select="(sectionId) => emit('selectSection', sectionId)"
          />
        </BudgetCell>
        <BudgetCell role="cell" class="tw-p-0">
          <CountInputCell
            class="tw-w-full"
            :count="row.expectedSectionCount"
            :countWithoutOverride="row.expectedSectionCountWithoutOverride"
            :canEdit="canEdit"
            :label="`Sections expected this term for ${row.name}`"
            :min="0"
            :max="20"
            @change="(count) => editExpectedSections(row, count)"
          />
        </BudgetCell>
        <ListedCell
          :listed="row.paidSectionCount"
          :isLoadMismatched="row.isLoadMismatched"
        />
        <BudgetCell role="cell" align="end" class="tw-font-bold">
          <MissingRate v-if="row.hasMissingRate" class="tw-mr-1" />
          {{ formatWholeDollars(row.total) }}
        </BudgetCell>
        <BudgetCell role="cell" :hasRightBorder="false" class="tw-p-0">
          <TextInputCell
            :value="row.notes"
            :canEdit="canEdit"
            :label="`Notes on ${row.name}`"
            @change="(value) => editNotes(row, value)"
          />
        </BudgetCell>
      </BudgetTableRow>
    </template>

    <template #totals>
      <div role="cell" class="tw-col-span-3 tw-whitespace-nowrap tw-p-2">
        Total · {{ totals.count }} P&amp;A and contract faculty
      </div>
      <TotalCell role="cell">{{ totals.expected }}</TotalCell>
      <TotalCell role="cell">{{ totals.listed }}</TotalCell>
      <TotalCell role="cell">{{ formatWholeDollars(totals.cost) }}</TotalCell>
      <div role="cell" />
    </template>
  </BudgetTable>
</template>

<script setup lang="ts">
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import CountInputCell from "./CountInputCell.vue";
import ListedCell from "./ListedCell.vue";
import MissingRate from "./MissingRate.vue";
import CellSubline from "./CellSubline.vue";
import PersonNameCell from "./PersonNameCell.vue";
import SectionLinks from "./SectionLinks.vue";
import TextInputCell from "./TextInputCell.vue";
import TotalCell from "./TotalCell.vue";
import { formatWholeDollars } from "../../helpers/money";
import type {
  PaContractRow,
  PaContractTotals,
} from "../../helpers/paContractRows";
import type { PersonInputEdit } from "../../helpers/personInputs";

defineProps<{
  rows: PaContractRow[];
  totals: PaContractTotals;
  canEdit: boolean;
}>();

const emit = defineEmits<{
  selectPerson: [emplid: number];
  selectSection: [sectionId: number];
  selectLeave: [leaveId: number];
  editPersonInput: [edit: PersonInputEdit];
}>();

const COLUMNS: BudgetColumn<PaContractRow>[] = [
  { label: "Name", sortValueOf: ({ name }) => name },
  { label: "Type", sortValueOf: ({ typeLabel }) => typeLabel },
  { label: "Sections" },
  {
    label: "Expected",
    isNumeric: true,
    sortValueOf: ({ expectedSectionCount }) => expectedSectionCount,
  },
  {
    label: "Listed",
    isNumeric: true,
    sortValueOf: ({ paidSectionCount }) => paidSectionCount,
  },
  {
    label: "Term cost",
    isNumeric: true,
    sortValueOf: ({ total }) => total,
  },
  { label: "Notes" },
];

const UNASSIGNED_GROUP = {
  label: "Not assigned this term",
  isInGroup: (row: PaContractRow) => !row.isAssigned,
};

const editExpectedSections = (
  { emplid }: PaContractRow,
  value: number | null,
) => emit("editPersonInput", { emplid, field: "expectedSections", value });

const editNotes = ({ emplid }: PaContractRow, value: string | null) =>
  emit("editPersonInput", { emplid, field: "notes", value });
</script>
