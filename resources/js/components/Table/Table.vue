<template>
  <div class="tw-relative tw-min-h-[8em] tw-overflow-hidden">
    <div
      class="tw-shadow-sm tw-ring-1 tw-ring-black tw-ring-opacity-5 sm:tw-rounded-lg tw-overflow-auto tw-max-h-[90vh]"
    >
      <table
        ref="tableElement"
        class="better-table tw-min-w-full tw-divide-y tw-divide-gray-300 tw-h-full"
        :class="{
          'better-table--sticky-header': stickyHeader,
          'better-table--sticky-first-col': stickyFirstColumn,
        }"
      >
        <slot />
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    stickyHeader?: boolean;
    stickyFirstColumn?: boolean;
  }>(),
  {
    stickyHeader: false,
    stickyFirstColumn: false,
  },
);

const tableElement = ref<HTMLTableElement | null>(null);

export interface Exposed {
  getTableElement: () => HTMLTableElement | null;
}

function getTableElement() {
  return tableElement.value;
}

defineExpose<Exposed>({
  getTableElement,
});
</script>
<style>
.better-table.better-table--sticky-header tbody tr {
  border-top: 1px solid #eee;
}
.better-table.better-table--sticky-header,
.better-table.better-table--sticky-first-col {
  border-collapse: separate;
  border-spacing: 0;
}
.better-table.better-table--sticky-header th {
  border-bottom: 1px solid #eee;
}

.better-table.better-table--sticky-header td {
  border-top: 1px solid #eee;
  vertical-align: top;
}

.better-table.better-table--sticky-header th {
  position: sticky;
  top: 0;
  background: #fafafa;
  z-index: 1;
}

.better-table.better-table--sticky-first-col td:first-child {
  position: sticky;
  left: 0;
  background: #fafafa;
  z-index: 1;
  border-right: #eee;
}

.better-table.better-table--sticky-first-col th:first-child {
  left: 0;
  z-index: 2;
  border-right: #eee;
}
</style>
