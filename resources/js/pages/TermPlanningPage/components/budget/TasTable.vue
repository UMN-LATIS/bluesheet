<template>
  <BudgetTable
    label="TAs and estimated costs"
    :columns="COLUMNS"
    :rows="rows"
    class="tw-min-w-[1056px] tw-grid-cols-[minmax(130px,1.1fr)_72px_minmax(170px,1.4fr)_104px_92px_100px_84px_72px_60px_minmax(140px,1.2fr)]"
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
        <BudgetCell
          role="cell"
          align="end"
          class="tw-text-on-surface-variant"
          :title="
            row.isAbd ? 'GA health and ABD tuition' : 'GA health and tuition'
          "
        >
          <template v-if="row.fringe !== null">
            {{ formatDollars(row.fringe) }}
          </template>
          <template v-else>–</template>
        </BudgetCell>
        <BudgetCell role="cell" align="end" class="tw-font-bold">
          <MissingRate v-if="row.hasMissingRate" class="tw-mr-1" />
          {{ formatWholeDollars(row.total) }}
        </BudgetCell>
        <BudgetCell role="cell" class="tw-p-0">
          <AppointmentSelect
            v-if="row.appointmentPercent !== null"
            class="tw-w-full"
            :appointmentPercent="row.appointmentPercent"
            :levels="appointmentLevels"
            :isOverridden="row.isAppointmentOverridden"
            :canEdit="canEdit"
            :label="`Appointment for ${row.name}`"
            @change="
              (percent) => editGrad(row, { appointmentPercent: percent })
            "
          />
          <span v-else class="tw-w-full tw-px-2 tw-text-right">–</span>
        </BudgetCell>
        <BudgetCell
          role="cell"
          class="tw-justify-center"
          :title="row.isAbd ? FEE_OFFSET_ABD_REASON : undefined"
        >
          <GradCheckbox
            v-if="row.appointmentPercent !== null"
            :isChecked="row.hasFeeOffset && !row.isAbd"
            :canEdit="canEdit && !row.isAbd"
            :label="`Student fee offset for ${row.name}`"
            @change="(isChecked) => editGrad(row, { hasFeeOffset: isChecked })"
          />
        </BudgetCell>
        <BudgetCell role="cell" class="tw-justify-center">
          <GradCheckbox
            v-if="row.appointmentPercent !== null"
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
        Total · {{ rows.length }} TAs
      </div>
      <TotalCell role="cell">{{ formatWholeDollars(salaryTotal) }}</TotalCell>
      <TotalCell role="cell">{{ formatWholeDollars(fringeTotal) }}</TotalCell>
      <TotalCell role="cell">{{ formatWholeDollars(total) }}</TotalCell>
      <TotalCell role="cell">{{ loadTotal }}%</TotalCell>
      <div role="cell" class="tw-col-span-3" />
    </template>
  </BudgetTable>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GradPerson } from "@/types";
import AppointmentSelect from "./AppointmentSelect.vue";
import BudgetCell from "./BudgetCell.vue";
import BudgetTable, { type BudgetColumn } from "./BudgetTable.vue";
import BudgetTableRow from "./BudgetTableRow.vue";
import GradCheckbox from "./GradCheckbox.vue";
import MissingRate from "./MissingRate.vue";
import PersonNameCell from "./PersonNameCell.vue";
import SectionLinks from "./SectionLinks.vue";
import TotalCell from "./TotalCell.vue";
import { formatDollars, formatWholeDollars } from "../../helpers/money";
import { gradPersonEditOf, type PersonRow } from "../../helpers/peopleRows";

const props = defineProps<{
  rows: PersonRow[];
  /** The term's appointment percents. */
  appointmentLevels: number[];
  canEdit: boolean;
}>();

const emit = defineEmits<{
  selectSection: [sectionId: number];
  selectPerson: [emplid: number];
  selectLeave: [leaveId: number];
  editGradPerson: [edit: GradPerson];
}>();

const FEE_OFFSET_ABD_REASON =
  "ABD job codes are ineligible for the student fee offset";

const COLUMNS: BudgetColumn<PersonRow>[] = [
  { label: "Name", sortValueOf: ({ name }) => name },
  { label: "Job code", sortValueOf: ({ jobCode }) => jobCode },
  { label: "Title", sortValueOf: ({ title }) => title || null },
  { label: "Salary", isNumeric: true, sortValueOf: ({ salary }) => salary },
  { label: "Fringe", isNumeric: true, sortValueOf: ({ fringe }) => fringe },
  { label: "Total", isNumeric: true, sortValueOf: ({ total }) => total },
  {
    label: "Load",
    isNumeric: true,
    sortValueOf: ({ appointmentPercent }) => appointmentPercent,
  },
  { label: "Fee off.", sortValueOf: ({ hasFeeOffset }) => hasFeeOffset },
  { label: "Intl.", sortValueOf: ({ isInternational }) => isInternational },
  { label: "Sections" },
];

const sumOf = (amountOf: (row: PersonRow) => number) =>
  props.rows.reduce((sum, row) => sum + amountOf(row), 0);

const salaryTotal = computed(() => sumOf(({ salary }) => salary ?? 0));
const fringeTotal = computed(() => sumOf(({ fringe }) => fringe ?? 0));
const total = computed(() => sumOf(({ total }) => total));
const loadTotal = computed(() =>
  sumOf(({ appointmentPercent }) => appointmentPercent ?? 0),
);

function editGrad(row: PersonRow, change: Partial<Omit<GradPerson, "emplid">>) {
  const edit = gradPersonEditOf(row, change);
  if (edit !== null) emit("editGradPerson", edit);
}
</script>
