<template>
  <div>
    <div class="sm:tw-flex sm:tw-items-baseline mb-4">
      <div class="sm:tw-flex-auto">
        <h1
          class="tw-text-lg tw-font-semibold tw-leading-6 tw-text-gray-900 tw-mb-0"
        >
          {{ name }}
        </h1>
        <p class="tw-mt-2 tw-text-sm tw-text-gray-700" v-if="description">
          {{ description }}
        </p>
      </div>
      <div class="tw-mt-4 sm:tw-ml-16 sm:tw-mt-0 sm:tw-flex-none">
        <slot name="actions" />
      </div>
    </div>
    <div
      class="tw-shadow-sm tw-ring-1 tw-ring-black tw-ring-opacity-5 sm:tw-rounded-lg tw-overflow-auto tw-max-h-[90vh]"
    >
      <table
        class="better-table tw-min-w-full tw-divide-y tw-divide-gray-300"
        :class="{
          'better-table--sticky-header': stickyHeader,
          'better-table--sticky-first-col': stickyFirstColumn,
        }"
      >
        <thead class="tw-bg-gray-50">
          <slot name="thead" />
        </thead>
        <tbody class="tw-divide-y tw-divide-gray-200 tw-bg-white">
          <slot />
        </tbody>
        <tfoot>
          <slot name="tfoot" />
        </tfoot>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    description?: string;
    stickyHeader?: boolean;
    stickyFirstColumn?: boolean;
  }>(),
  {
    stickyHeader: false,
    stickyFirstColumn: false,
  },
);
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
