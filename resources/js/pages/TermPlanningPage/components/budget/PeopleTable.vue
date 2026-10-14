<template>
  <BudgetTable
    label="People and estimated costs"
    :columns="COLUMNS"
    :rows="rows"
    :collapsedGroup="UNASSIGNED_GROUP"
    class="tw-min-w-[1100px] tw-grid-cols-[minmax(140px,1.2fr)_72px_minmax(150px,1.3fr)_104px_96px_100px_72px_72px_60px_minmax(140px,1.2fr)]"
  >
    <template #default="{ rows: shownRows }">
      <BudgetTableRow
        v-for="row in shownRows"
        :key="row.emplid ?? 'unstaffed'"
        class="tw-min-h-10 tw-bg-surface-bright"
      >
        <PersonNameCell
          :row="row"
          @selectPerson="(emplid) => emit('selectPerson', emplid)"
          @selectLeave="(leaveId) => emit('selectLeave', leaveId)"
        />
        <BudgetCell role="cell" class="tw-tabular-nums">
          {{ row.jobCode }}
        </BudgetCell>
        <BudgetCell role="cell">
          <span class="tw-truncate" :title="row.title">{{ row.title }}</span>
        </BudgetCell>
        <BudgetCell
          role="cell"
          class="tw-flex-col tw-items-end tw-justify-center tw-tabular-nums"
        >
          <span>{{ formatWholeDollars(row.termSalary) }}</span>
          <CellSubline v-if="row.salaryHint">{{ row.salaryHint }}</CellSubline>
        </BudgetCell>
        <BudgetCell
          role="cell"
          align="end"
          class="tw-text-on-surface-variant"
          :title="fringeTitleOf(row)"
        >
          {{ formatWholeDollars(row.termFringe) }}
        </BudgetCell>
        <BudgetCell role="cell" align="end" class="tw-font-bold">
          <MissingRate v-if="row.hasMissingRate" class="tw-mr-1" />
          {{ formatWholeDollars(row.total) }}
        </BudgetCell>
        <BudgetCell
          role="cell"
          align="end"
          class="tw-font-semibold"
          :class="
            row.isUnderLoad ? 'tw-text-brand' : 'tw-text-on-surface-variant'
          "
        >
          {{ row.loadLabel }}
        </BudgetCell>
        <BudgetCell role="cell" class="tw-justify-center">
          <GradCheckbox
            v-if="row.isGrad"
            :isChecked="row.hasFeeOffset && !row.isAbd"
            :canEdit="canEdit && !row.isAbd"
            :disabledReason="row.isAbd ? FEE_OFFSET_ABD_REASON : undefined"
            :label="`Student fee offset for ${row.name}`"
            @change="(isChecked) => editGrad(row, { hasFeeOffset: isChecked })"
          />
        </BudgetCell>
        <BudgetCell role="cell" class="tw-justify-center">
          <GradCheckbox
            v-if="row.isGrad"
            :isChecked="row.isInternational"
            :canEdit="canEdit"
            :label="`International GA offset for ${row.name}`"
            @change="
              (isChecked) => editGrad(row, { isInternational: isChecked })
            "
          />
        </BudgetCell>
        <BudgetCell role="cell" :hasRightBorder="false" class="tw-py-1">
          <SectionLinks
            :sections="row.sections"
            @select="(sectionId) => emit('selectSection', sectionId)"
          />
        </BudgetCell>
      </BudgetTableRow>
    </template>

    <template #totals>
      <div role="cell" class="tw-col-span-3 tw-whitespace-nowrap tw-p-2">
        Total · {{ personCount }} people, {{ unstaffedSectionCount }}
        unstaffed sections
      </div>
      <TotalCell role="cell">{{ formatWholeDollars(salaryTotal) }}</TotalCell>
      <TotalCell role="cell">{{ formatWholeDollars(fringeTotal) }}</TotalCell>
      <TotalCell role="cell">{{ formatWholeDollars(total) }}</TotalCell>
      <div role="cell" class="tw-col-span-4" />
    </template>
  </BudgetTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GradPerson } from "@/types";
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import CellSubline from "./CellSubline.vue";
import GradCheckbox from "./GradCheckbox.vue";
import MissingRate from "./MissingRate.vue";
import PersonNameCell from "./PersonNameCell.vue";
import SectionLinks from "./SectionLinks.vue";
import TotalCell from "./TotalCell.vue";
import { FEE_OFFSET_ABD_REASON } from "../../helpers/gradCost";
import { formatWholeDollars } from "../../helpers/money";
import { gradPersonEditOf, type PersonRow } from "../../helpers/peopleRows";

const props = defineProps<{
  rows: PersonRow[];
  canEdit: boolean;
}>();

const emit = defineEmits<{
  selectSection: [sectionId: number];
  selectPerson: [emplid: number];
  selectLeave: [leaveId: number];
  editGradPerson: [edit: GradPerson];
}>();

const COLUMNS: BudgetColumn<PersonRow>[] = [
  { label: "Name", sortValueOf: ({ name }) => name },
  { label: "Job code", sortValueOf: ({ jobCode }) => jobCode },
  { label: "Title", sortValueOf: ({ title }) => title || null },
  {
    label: "Salary",
    isNumeric: true,
    sortValueOf: ({ termSalary }) => termSalary,
  },
  {
    label: "Fringe",
    isNumeric: true,
    sortValueOf: ({ termFringe }) => termFringe,
  },
  { label: "Total", isNumeric: true, sortValueOf: ({ total }) => total },
  {
    label: "Load",
    isNumeric: true,
    sortValueOf: ({ appointmentPercent, sections }) =>
      appointmentPercent ?? sections.length,
  },
  { label: "Fee off.", sortValueOf: ({ hasFeeOffset }) => hasFeeOffset },
  { label: "Intl.", sortValueOf: ({ isInternational }) => isInternational },
  { label: "Sections" },
];

const UNASSIGNED_GROUP = {
  label: "Not assigned this term",
  isInGroup: (row: PersonRow) => !row.isAssigned,
};

const fringeTitleOf = (row: PersonRow) => {
  if (!row.isGrad) return undefined;

  return row.isAbd ? "GA health and ABD tuition" : "GA health and tuition";
};

const personCount = computed(
  () =>
    props.rows.filter(({ emplid, isAssigned }) => emplid !== null && isAssigned)
      .length,
);

const unstaffedSectionCount = computed(
  () => props.rows.find(({ emplid }) => emplid === null)?.sections.length ?? 0,
);

const sumOf = (amountOf: (row: PersonRow) => number) =>
  props.rows.reduce((sum, row) => sum + amountOf(row), 0);

const salaryTotal = computed(() => sumOf(({ termSalary }) => termSalary));
const fringeTotal = computed(() => sumOf(({ termFringe }) => termFringe));
const total = computed(() => sumOf(({ total }) => total));

function editGrad(row: PersonRow, change: Partial<Omit<GradPerson, "emplid">>) {
  const edit = gradPersonEditOf(row, change);
  if (edit !== null) emit("editGradPerson", edit);
}
</script>
