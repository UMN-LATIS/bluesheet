<template>
  <BudgetTable
    :label="label"
    :columns="columns"
    class="tw-min-w-[1088px] tw-grid-cols-[minmax(220px,1.1fr)_64px_120px_104px_100px_120px_minmax(200px,1.6fr)_minmax(160px,1.2fr)]"
  >
    <template #default>
      <BudgetTableRow
        v-for="row in rows"
        :key="row.emplid ?? 'unstaffed'"
        class="tw-min-h-9 tw-bg-surface-bright"
      >
        <BudgetCell
          role="cell"
          class="tw-flex-col tw-items-stretch tw-justify-center tw-gap-0.5 tw-py-1"
        >
          <button
            v-if="row.emplid !== null"
            type="button"
            class="tw-block tw-min-w-0 tw-cursor-pointer tw-truncate tw-border-none tw-bg-transparent tw-p-0 tw-text-left tw-text-xs tw-font-semibold tw-text-on-surface hover:tw-underline"
            :title="row.name"
            @click="emit('selectPerson', row.emplid)"
          >
            {{ row.name }}
          </button>
          <span
            v-else
            class="tw-block tw-min-w-0 tw-truncate tw-font-semibold tw-text-brand"
            :title="row.name"
          >
            {{ row.name }}
          </span>
          <CellSubline :title="appointmentOf(row)">
            {{ appointmentOf(row) }}
          </CellSubline>
          <LeaveBadge
            v-for="leave in row.leaves"
            :key="leave.id"
            class="tw-self-start"
            :leave="leave"
            @click="emit('selectLeave', leave.id)"
          />
        </BudgetCell>
        <BudgetCell role="cell" class="tw-text-on-surface-variant">
          {{ row.fundLabel }}
        </BudgetCell>
        <BudgetCell role="cell" class="tw-p-0">
          <EditableCell
            class="tw-w-full"
            kind="dollars"
            :amount="row.salary"
            :amountWithoutOverride="row.salaryWithoutOverride"
            :isOverridden="row.isSalaryOverridden"
            :canEdit="canEditSalary && row.emplid !== null"
            :label="`${salaryHeading} for ${row.name}`"
            @change="(amount) => editSalary(row, amount)"
          />
        </BudgetCell>
        <BudgetCell role="cell" align="end">
          <template v-if="row.fringe !== null">
            {{ formatDollars(row.fringe) }}
          </template>
          <template v-else>–</template>
        </BudgetCell>
        <BudgetCell role="cell" align="end" class="tw-font-semibold">
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
        <BudgetCell role="cell" class="tw-flex-wrap tw-gap-1 tw-py-1">
          <SectionChip
            v-for="paidSection in row.paidSections"
            :key="paidSection.sectionId"
            :label="paidSection.label"
            :component="paidSection.component"
            :isReadOnly="isReadOnly"
            :aria-label="`Open ${paidSection.label}`"
            @click="emit('selectSection', paidSection.sectionId)"
          />
        </BudgetCell>
        <BudgetCell role="cell" :hasRightBorder="false" class="tw-p-0">
          <input
            v-if="row.emplid !== null"
            :value="row.notes"
            :disabled="!canEdit"
            :aria-label="`Notes on ${row.name}`"
            class="tw-h-full tw-min-h-9 tw-w-full tw-border-none tw-bg-transparent tw-px-2 tw-text-[11.5px] tw-text-on-surface tw-outline-none focus:tw-bg-surface-bright disabled:tw-cursor-default"
            @input="onNotesInput(row, $event)"
          />
        </BudgetCell>
      </BudgetTableRow>
    </template>

    <template #totals>
      <div role="cell" class="tw-whitespace-nowrap tw-p-2">
        Total · {{ personCount }} {{ peopleNoun }}
      </div>
      <div role="cell" class="tw-col-span-3" />
      <TotalCell role="cell">{{ formatWholeDollars(total) }}</TotalCell>
      <div role="cell" class="tw-col-span-3" />
    </template>
  </BudgetTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BudgetCell from "./BudgetCell.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import CellSubline from "./CellSubline.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import EditableCell from "./EditableCell.vue";
import LeaveBadge from "./LeaveBadge.vue";
import MissingRate from "./MissingRate.vue";
import TotalCell from "./TotalCell.vue";
import SectionChip from "../SectionChip.vue";
import { formatDollars, formatWholeDollars } from "../../helpers/money";
import type { PersonRow } from "../../helpers/peopleRows";

const props = defineProps<{
  rows: PersonRow[];
  label: string;
  peopleNoun: string;
  paidUnit: "section" | "course";
  canEdit: boolean;
  isReadOnly: boolean;
}>();

const emit = defineEmits<{
  selectSection: [sectionId: number];
  selectPerson: [emplid: number];
  selectLeave: [leaveId: number];
  editSalary: [emplid: number, amount: number | null];
  editNotes: [emplid: number, notes: string];
}>();

const salaryHeading = computed(() => `Salary / ${props.paidUnit}`);

const canEditSalary = computed(
  () => props.canEdit && props.paidUnit === "section",
);

const columns = computed((): BudgetColumn[] => [
  { label: "Name" },
  { label: "Fund" },
  { label: salaryHeading.value, isNumeric: true },
  { label: `Fringe / ${props.paidUnit}`, isNumeric: true },
  { label: "Total", isNumeric: true },
  { label: "Load", isNumeric: true },
  { label: "Sections" },
  { label: "Notes" },
]);

const appointmentOf = ({ jobCode, title }: PersonRow) =>
  title === "" ? jobCode : `${jobCode} · ${title}`;

const personCount = computed(
  () => props.rows.filter(({ emplid }) => emplid !== null).length,
);

const total = computed(() =>
  props.rows.reduce((sum, { total }) => sum + total, 0),
);

function editSalary(row: PersonRow, amount: number | null) {
  if (row.emplid !== null) emit("editSalary", row.emplid, amount);
}

function onNotesInput(row: PersonRow, event: Event) {
  if (row.emplid === null) return;

  emit("editNotes", row.emplid, (event.target as HTMLInputElement).value);
}
</script>
