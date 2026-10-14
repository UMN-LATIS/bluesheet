<template>
  <BudgetTable
    label="Instructors and estimated costs"
    :columns="COLUMNS"
    :rows="rows"
    class="tw-min-w-[1000px] tw-grid-cols-[minmax(140px,1.2fr)_72px_minmax(150px,1.3fr)_116px_96px_104px_72px_minmax(160px,1.4fr)]"
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
          v-if="row.isSalaryReadOnly"
          role="cell"
          class="tw-flex-col tw-items-end tw-justify-center tw-tabular-nums"
        >
          <span class="tw-font-semibold">
            <template v-if="row.salary !== null">
              {{ formatDollars(row.salary) }}
            </template>
            <template v-else>–</template>
          </span>
          <span
            v-if="row.salaryHint"
            class="tw-whitespace-nowrap tw-text-[10.5px] tw-text-on-surface-variant"
          >
            {{ row.salaryHint }}
          </span>
        </BudgetCell>
        <BudgetCell v-else role="cell" class="tw-p-0">
          <EditableCell
            class="tw-w-full"
            kind="dollars"
            :amount="row.salary"
            :amountWithoutOverride="row.salaryWithoutOverride"
            :isOverridden="row.isSalaryOverridden"
            :canEdit="canEdit && row.emplid !== null"
            :label="`Salary per section for ${row.name}`"
            @change="(amount) => editSalary(row, amount)"
          />
        </BudgetCell>
        <BudgetCell
          role="cell"
          align="end"
          class="tw-text-on-surface-variant"
          :title="
            row.isSalaryReadOnly
              ? 'GA health and tuition, from Grad Rates'
              : undefined
          "
        >
          <template v-if="row.fringe === null || row.fundLabel === 'Recurring'">
            –
          </template>
          <template v-else>{{ formatDollars(row.fringe) }}</template>
        </BudgetCell>
        <BudgetCell role="cell" align="end" class="tw-font-bold">
          <MissingRate v-if="row.hasMissingRate" class="tw-mr-1" />
          {{ formatWholeDollars(row.total) }}
        </BudgetCell>
        <BudgetCell
          role="cell"
          align="end"
          :class="{ 'tw-font-bold tw-text-[#b91c1c]': row.isUnderLoad }"
        >
          {{ row.loadLabel }}
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
      <div role="cell" class="tw-col-span-5 tw-whitespace-nowrap tw-p-2">
        Total · {{ personCount }} instructors, {{ unstaffedSectionCount }}
        unstaffed sections
      </div>
      <TotalCell role="cell">{{ formatWholeDollars(total) }}</TotalCell>
      <TotalCell role="cell">{{ sectionCount }}</TotalCell>
      <div role="cell" />
    </template>
  </BudgetTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import EditableCell from "./EditableCell.vue";
import MissingRate from "./MissingRate.vue";
import PersonNameCell from "./PersonNameCell.vue";
import SectionLinks from "./SectionLinks.vue";
import TotalCell from "./TotalCell.vue";
import { formatDollars, formatWholeDollars } from "../../helpers/money";
import type { PersonRow } from "../../helpers/peopleRows";

const props = defineProps<{
  rows: PersonRow[];
  canEdit: boolean;
}>();

const emit = defineEmits<{
  selectSection: [sectionId: number];
  selectPerson: [emplid: number];
  selectLeave: [leaveId: number];
  editSalary: [emplid: number, amount: number | null];
}>();

const COLUMNS: BudgetColumn<PersonRow>[] = [
  { label: "Name", sortValueOf: ({ name }) => name },
  { label: "Job code", sortValueOf: ({ jobCode }) => jobCode },
  { label: "Title", sortValueOf: ({ title }) => title || null },
  { label: "Salary per", isNumeric: true, sortValueOf: ({ salary }) => salary },
  { label: "Fringe per", isNumeric: true, sortValueOf: ({ fringe }) => fringe },
  { label: "Total", isNumeric: true, sortValueOf: ({ total }) => total },
  {
    label: "Load",
    isNumeric: true,
    sortValueOf: ({ sections }) => sections.length,
  },
  { label: "Sections" },
];

const personCount = computed(
  () => props.rows.filter(({ emplid }) => emplid !== null).length,
);

const unstaffedSectionCount = computed(
  () => props.rows.find(({ emplid }) => emplid === null)?.sections.length ?? 0,
);

const sectionCount = computed(() =>
  props.rows.reduce((count, { sections }) => count + sections.length, 0),
);

const total = computed(() =>
  props.rows.reduce((sum, { total }) => sum + total, 0),
);

function editSalary(row: PersonRow, amount: number | null) {
  if (row.emplid !== null) emit("editSalary", row.emplid, amount);
}
</script>
