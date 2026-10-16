<template>
  <BudgetTable
    label="Tenure-track faculty"
    :columns="COLUMNS"
    :rows="rows"
    :collapsedGroup="UNASSIGNED_GROUP"
    class="tw-min-w-[1000px] tw-grid-cols-[minmax(170px,1.2fr)_80px_minmax(150px,1fr)_72px_minmax(150px,1fr)_96px_minmax(140px,1fr)]"
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
          <CellSubline>{{ row.jobLabel }}</CellSubline>
        </PersonNameCell>
        <BudgetCell role="cell" align="end" class="tw-font-semibold">
          {{ row.paidSectionCount }}
        </BudgetCell>
        <BudgetCell role="cell" class="tw-py-1">
          <SectionLinks
            :sections="row.sections"
            @select="(sectionId) => emit('selectSection', sectionId)"
          />
        </BudgetCell>
        <BudgetCell role="cell" class="tw-p-0">
          <IntegerInputCell
            class="tw-w-full"
            :count="row.courseReleases"
            :canEdit="canEdit"
            :label="`Course releases for ${row.name}`"
            :min="0"
            :max="20"
            @change="(count) => editCourseReleases(row, count)"
          />
        </BudgetCell>
        <BudgetCell role="cell" class="tw-p-0">
          <TextInputCell
            :value="row.releaseSource"
            :canEdit="canEdit"
            :label="`Release or buyout source for ${row.name}`"
            @change="(value) => editText(row, 'releaseSource', value)"
          />
        </BudgetCell>
        <BudgetCell role="cell" align="end" class="tw-font-bold">
          {{ formatWholeDollars(row.total) }}
        </BudgetCell>
        <BudgetCell role="cell" :hasRightBorder="false" class="tw-p-0">
          <TextInputCell
            :value="row.notes"
            :canEdit="canEdit"
            :label="`Notes on ${row.name}`"
            @change="(value) => editText(row, 'notes', value)"
          />
        </BudgetCell>
      </BudgetTableRow>
    </template>

    <template #totals>
      <div role="cell" class="tw-whitespace-nowrap tw-p-2">
        Total · {{ totals.count }} tenure-track faculty
      </div>
      <TotalCell role="cell">{{ totals.load }}</TotalCell>
      <div role="cell" />
      <TotalCell role="cell">{{ totals.releases }}</TotalCell>
      <div role="cell" />
      <TotalCell role="cell">{{ formatWholeDollars(totals.cost) }}</TotalCell>
      <div role="cell" />
    </template>
  </BudgetTable>
</template>

<script setup lang="ts">
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import IntegerInputCell from "./IntegerInputCell.vue";
import CellSubline from "./CellSubline.vue";
import PersonNameCell from "./PersonNameCell.vue";
import SectionLinks from "./SectionLinks.vue";
import TextInputCell from "./TextInputCell.vue";
import TotalCell from "./TotalCell.vue";
import { formatWholeDollars } from "../../helpers/money";
import type { PersonInputEdit } from "../../helpers/personInputs";
import type {
  TenureTrackRow,
  TenureTrackTotals,
} from "../../helpers/tenureTrackRows";

defineProps<{
  rows: TenureTrackRow[];
  totals: TenureTrackTotals;
  canEdit: boolean;
}>();

const emit = defineEmits<{
  selectPerson: [emplid: number];
  selectSection: [sectionId: number];
  selectLeave: [leaveId: number];
  editPersonInput: [edit: PersonInputEdit];
}>();

const COLUMNS: BudgetColumn<TenureTrackRow>[] = [
  { label: "Faculty", sortValueOf: ({ name }) => name },
  {
    label: "Load",
    isNumeric: true,
    sortValueOf: ({ paidSectionCount }) => paidSectionCount,
  },
  { label: "Sections" },
  {
    label: "Releases",
    isNumeric: true,
    sortValueOf: ({ courseReleases }) => courseReleases,
  },
  { label: "Release / buyout source" },
  {
    label: "Term cost",
    isNumeric: true,
    sortValueOf: ({ total }) => total,
  },
  { label: "Notes" },
];

const UNASSIGNED_GROUP = {
  label: "Not assigned this term",
  isInGroup: (row: TenureTrackRow) => !row.isAssigned,
};

const editCourseReleases = ({ emplid }: TenureTrackRow, value: number | null) =>
  emit("editPersonInput", { emplid, field: "courseReleases", value });

const editText = (
  { emplid }: TenureTrackRow,
  field: "notes" | "releaseSource",
  value: string | null,
) => emit("editPersonInput", { emplid, field, value });
</script>
