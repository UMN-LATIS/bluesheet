<template>
  <div class="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
    <div
      class="tw-flex tw-flex-none tw-justify-end tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-px-2 tw-py-1.5"
    >
      <AdminRatesLink novaResourceUriKey="job-code-term-rates" />
    </div>

    <BudgetTable
      label="Instructor costs"
      :columns="COLUMNS"
      :rows="groups"
      class="tw-min-w-[980px] tw-grid-cols-[minmax(160px,1.2fr)_170px_88px_72px_120px_72px_104px_minmax(140px,1fr)]"
    >
      <template #default="{ rows: shownGroups }">
        <template v-for="group in shownGroups" :key="group.label">
          <BudgetTableRow
            class="tw-border-0 tw-border-b tw-border-solid tw-border-surface-container tw-bg-surface"
          >
            <SpanningLabelCell
              :columnCount="COLUMNS.length"
              class="tw-col-span-full tw-px-2 tw-py-1.5"
            >
              <CapsLabel>{{ group.label }}</CapsLabel>
            </SpanningLabelCell>
          </BudgetTableRow>

          <PersonTableRow
            v-for="row in group.rows"
            :key="row.emplid ?? 'unstaffed'"
            :emplid="row.emplid"
            class="tw-min-h-10"
            @selectPerson="(emplid) => emit('selectPerson', emplid)"
          >
            <PersonNameCell
              :row="row"
              @selectPerson="(emplid) => emit('selectPerson', emplid)"
              @selectLeave="(leaveId) => emit('selectLeave', leaveId)"
            >
              <CellSubline>{{ row.title }}</CellSubline>
            </PersonNameCell>
            <BudgetCell role="cell">{{ row.typeLabel }}</BudgetCell>
            <BudgetCell role="cell" class="tw-text-on-surface-variant">
              {{ row.fundLabel }}
            </BudgetCell>
            <BudgetCell role="cell" class="tw-tabular-nums">
              {{ row.jobCode }}
            </BudgetCell>

            <BudgetCell role="cell" align="end" class="tw-relative">
              <MissingRate v-if="row.ratePerSection.kind === 'missingRate'" />
              <template v-else-if="row.ratePerSection.kind === 'amount'">
                {{ formatWholeDollars(row.ratePerSection.dollars) }}
                <OverrideMarker v-if="row.ratePerSection.isOverridden" />
              </template>
              <span v-else class="tw-text-on-surface-variant">{{
                row.ratePerSection.percentLabel
              }}</span>
            </BudgetCell>
            <BudgetCell
              role="cell"
              align="end"
              class="tw-text-on-surface-variant"
            >
              {{ row.loadLabel }}
            </BudgetCell>
            <BudgetCell role="cell" align="end" class="tw-font-bold">
              <MissingRate v-if="row.hasMissingRate" class="tw-mr-1" />
              {{ formatWholeDollars(row.total) }}
            </BudgetCell>
            <BudgetCell role="cell" :hasRightBorder="false" class="tw-p-0">
              <TextInputCell
                :value="row.notes"
                :canEdit="canEdit && row.emplid !== null"
                :label="`Notes on ${row.name}`"
                @change="(value) => editNotes(row, value)"
              />
            </BudgetCell>
          </PersonTableRow>
        </template>
      </template>

      <template #totals>
        <SpanningLabelCell :columnCount="6" class="tw-col-span-6 tw-p-2">
          Total
        </SpanningLabelCell>
        <TotalCell role="cell">{{ formatWholeDollars(totalCost) }}</TotalCell>
        <div role="cell" />
      </template>
    </BudgetTable>
  </div>
</template>

<script setup lang="ts">
import AdminRatesLink from "./AdminRatesLink.vue";
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import PersonTableRow from "./PersonTableRow.vue";
import CapsLabel from "./CapsLabel.vue";
import CellSubline from "./CellSubline.vue";
import MissingRate from "./MissingRate.vue";
import OverrideMarker from "./OverrideMarker.vue";
import PersonNameCell from "./PersonNameCell.vue";
import SpanningLabelCell from "./SpanningLabelCell.vue";
import TextInputCell from "./TextInputCell.vue";
import TotalCell from "./TotalCell.vue";
import type {
  InstructorCostGroup,
  InstructorCostRow,
} from "../../helpers/instructorCostRows";
import { formatWholeDollars } from "../../helpers/money";
import type { PersonInputEdit } from "../../helpers/personInputs";

defineProps<{
  groups: InstructorCostGroup[];
  totalCost: number;
  canEdit: boolean;
}>();

const emit = defineEmits<{
  selectPerson: [emplid: number];
  selectLeave: [leaveId: number];
  editPersonInput: [edit: PersonInputEdit];
}>();

const COLUMNS: BudgetColumn<InstructorCostGroup>[] = [
  { label: "Name" },
  { label: "Instructor type" },
  { label: "Funding" },
  { label: "Job code" },
  { label: "Rate per section", isNumeric: true },
  { label: "Load", isNumeric: true },
  { label: "Term cost", isNumeric: true },
  { label: "Notes" },
];

function editNotes({ emplid }: InstructorCostRow, value: string | null) {
  if (emplid !== null) {
    emit("editPersonInput", { emplid, field: "notes", value });
  }
}
</script>
