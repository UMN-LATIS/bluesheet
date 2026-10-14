<template>
  <div
    class="budget-table scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-auto"
  >
    <div
      role="table"
      :aria-label="label"
      class="tw-grid tw-text-xs"
      v-bind="$attrs"
    >
      <BudgetTableRow
        class="tw-sticky tw-top-0 tw-z-[2] tw-border-0 tw-border-b tw-border-solid tw-border-outline tw-bg-surface-bright"
      >
        <div
          v-for="(column, columnIndex) in columns"
          :key="column.label"
          role="columnheader"
          :aria-sort="
            sort?.columnIndex === columnIndex ? sort.direction : undefined
          "
          class="tw-flex tw-overflow-hidden tw-whitespace-nowrap tw-border-0 tw-border-r tw-border-solid tw-border-surface-container"
          :class="{ 'tw-justify-end': column.isNumeric ?? false }"
        >
          <button
            v-if="column.sortValueOf"
            type="button"
            class="tw-flex tw-min-w-0 tw-flex-1 tw-cursor-pointer tw-items-center tw-gap-0.5 tw-border-none tw-bg-transparent tw-px-2 tw-py-[7px] hover:tw-bg-surface"
            :class="{ 'tw-flex-row-reverse': column.isNumeric ?? false }"
            @click="sort = nextSortOf(sort, columnIndex)"
          >
            <CapsLabel
              :class="{
                'tw-text-on-surface': sort?.columnIndex === columnIndex,
              }"
            >
              {{ column.label }}
            </CapsLabel>
            <ChevronDownIcon
              v-if="sort?.columnIndex === columnIndex"
              aria-hidden="true"
              class="tw-flex-none"
              :class="{ 'tw-rotate-180': sort.direction === 'ascending' }"
            />
          </button>
          <CapsLabel v-else class="tw-px-2 tw-py-[7px]">
            {{ column.label }}
          </CapsLabel>
        </div>
      </BudgetTableRow>

      <slot :rows="shownRows" />

      <BudgetTableRow
        v-if="$slots.totals"
        class="tw-sticky tw-bottom-0 tw-z-[2] tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-bg-surface tw-font-bold"
      >
        <slot name="totals" />
      </BudgetTableRow>
    </div>
  </div>
</template>

<script setup lang="ts" generic="Row">
import { computed, ref } from "vue";
import { ChevronDownIcon } from "@/icons";
import BudgetTableRow from "./BudgetTableRow.vue";
import CapsLabel from "./CapsLabel.vue";
import {
  nextSortOf,
  sortedRows,
  type RowSort,
  type SortValue,
} from "../../helpers/rowSort";

export interface BudgetColumn<Row = unknown> {
  label: string;
  isNumeric?: boolean;
  sortValueOf?: (row: Row) => SortValue;
}

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label: string;
  columns: BudgetColumn<Row>[];
  rows: Row[];
}>();

defineSlots<{
  default(props: { rows: Row[] }): unknown;
  totals?(): unknown;
}>();

const sort = ref<RowSort | null>(null);

const shownRows = computed(() => {
  const sortValueOf =
    sort.value && props.columns[sort.value.columnIndex]?.sortValueOf;

  return sort.value && sortValueOf
    ? sortedRows(props.rows, sortValueOf, sort.value.direction)
    : props.rows;
});
</script>

<style scoped>
.budget-table :deep([role="row"] > :first-child) {
  position: sticky;
  left: 0;
  z-index: 1;
  background-color: inherit;
  box-shadow: inherit;
}
</style>
