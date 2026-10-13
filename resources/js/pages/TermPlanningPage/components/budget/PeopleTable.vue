<template>
  <div class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto">
    <div role="table" :aria-label="label" class="tw-min-w-[1000px] tw-text-xs">
      <div
        role="row"
        class="tw-sticky tw-top-0 tw-z-[2] tw-grid tw-border-0 tw-border-b tw-border-solid tw-border-outline tw-bg-surface-bright"
        :style="{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }"
      >
        <CapsLabel
          v-for="column in headings"
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
        :key="row.emplid ?? 'unstaffed'"
        role="row"
        class="tw-grid tw-min-h-9 tw-bg-surface-bright"
        :style="{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }"
      >
        <BudgetCell
          role="cell"
          class="tw-font-semibold"
          :class="{ 'tw-text-brand': row.emplid === null }"
        >
          <span class="tw-truncate" :title="row.name">{{ row.name }}</span>
        </BudgetCell>
        <BudgetCell role="cell" class="tw-tabular-nums">
          {{ row.jobCode }}
        </BudgetCell>
        <BudgetCell role="cell">
          <span class="tw-truncate" :title="row.title">{{ row.title }}</span>
        </BudgetCell>
        <BudgetCell role="cell" class="tw-text-on-surface-variant">
          {{ row.fundLabel }}
        </BudgetCell>
        <RateInputCell
          v-if="row.emplid !== null"
          role="cell"
          :amount="row.rate"
          :amountWithoutOverride="row.rateWithoutOverride"
          :isOverridden="row.isRateOverridden"
          :canEdit="canEdit"
          :label="`${costHeading} for ${row.name}`"
          @change="(amount) => editRate(row, amount)"
        />
        <BudgetCell v-else role="cell" align="end" class="tw-font-semibold">
          <MissingRate v-if="row.rate === null" />
          <template v-else>{{ formatDollars(row.rate) }}</template>
        </BudgetCell>
        <BudgetCell
          role="cell"
          align="end"
          :class="{ 'tw-font-bold tw-text-[#b91c1c]': row.isUnderLoad }"
        >
          {{ row.loadLabel }}
        </BudgetCell>
        <BudgetCell
          role="cell"
          align="end"
          class="tw-relative tw-font-semibold"
          :class="{ 'tw-bg-accent-container-low': row.hasLineOverride }"
        >
          <MissingRate v-if="row.hasMissingRate" class="tw-mr-1" />
          {{ formatWholeDollars(row.total) }}
          <OverrideMarker v-if="row.hasLineOverride" />
        </BudgetCell>
        <BudgetCell
          role="cell"
          :hasRightBorder="false"
          class="tw-flex-wrap tw-gap-x-2.5 tw-gap-y-0.5 tw-py-1"
        >
          <button
            v-for="paidSection in row.paidSections"
            :key="paidSection.sectionId"
            type="button"
            class="tw-cursor-pointer tw-whitespace-nowrap tw-border-none tw-bg-transparent tw-p-0 tw-text-xs tw-text-primary hover:tw-underline"
            :aria-label="`Open ${paidSection.label}`"
            @click="emit('selectSection', paidSection.sectionId)"
          >
            {{ paidSection.label }}
          </button>
        </BudgetCell>
      </div>

      <div
        role="row"
        class="tw-sticky tw-bottom-0 tw-grid tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-bg-surface tw-font-bold"
        :style="{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }"
      >
        <div role="cell" class="tw-col-span-6 tw-p-2">
          Total · {{ personCount }} {{ peopleNoun }}
        </div>
        <TotalCell role="cell">{{ formatWholeDollars(total) }}</TotalCell>
        <div role="cell" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BudgetCell from "./BudgetCell.vue";
import CapsLabel from "./CapsLabel.vue";
import MissingRate from "./MissingRate.vue";
import OverrideMarker from "./OverrideMarker.vue";
import RateInputCell from "./RateInputCell.vue";
import TotalCell from "./TotalCell.vue";
import { formatDollars, formatWholeDollars } from "../../helpers/money";
import type { PersonRow } from "../../helpers/peopleRows";

const props = defineProps<{
  rows: PersonRow[];
  label: string;
  peopleNoun: string;
  costHeading: string;
  canEdit: boolean;
}>();

const emit = defineEmits<{
  selectSection: [sectionId: number];
  editRate: [emplid: number, amount: number | null];
}>();

const GRID_TEMPLATE_COLUMNS =
  "minmax(150px,1.2fr) 76px minmax(150px,1.3fr) 84px 120px 76px 108px minmax(180px,1.6fr)";

const headings = computed(() => [
  { label: "Name", isNumeric: false },
  { label: "Job code", isNumeric: false },
  { label: "Title", isNumeric: false },
  { label: "Fund", isNumeric: false },
  { label: props.costHeading, isNumeric: true },
  { label: "Load", isNumeric: true },
  { label: "Total cost", isNumeric: true },
  { label: "Sections", isNumeric: false },
]);

const personCount = computed(
  () => props.rows.filter(({ emplid }) => emplid !== null).length,
);

const total = computed(() =>
  props.rows.reduce((sum, { total }) => sum + total, 0),
);

function editRate(row: PersonRow, amount: number | null) {
  if (row.emplid === null) return;

  const isDefault = amount === null || amount === row.rateWithoutOverride;
  emit("editRate", row.emplid, isDefault ? null : amount);
}
</script>
