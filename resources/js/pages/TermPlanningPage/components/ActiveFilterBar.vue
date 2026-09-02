<template>
  <div
    v-if="facetsInUse.length > 0"
    class="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs"
  >
    <span class="tw-mr-2 tw-text-neutral-500">
      {{ shownCount }} of {{ totalCount }} sections
    </span>

    <template v-for="(facet, index) in facetsInUse" :key="facet">
      <!-- Chips within a facet are alternatives; facets narrow each other. -->
      <span
        v-if="index > 0"
        class="tw-font-semibold tw-uppercase tw-text-neutral-500"
      >
        and
      </span>
      <span
        v-for="value in filters[facet]"
        :key="value"
        class="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-bg-primary-container tw-py-0.5 tw-pl-2.5 tw-pr-0.5 tw-text-on-primary-container"
      >
        {{ optionLabel(options, facet, value) }}
        <button
          type="button"
          class="tw-flex tw-h-4 tw-w-4 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-leading-none tw-text-on-primary-container hover:tw-bg-surface-bright/60"
          :aria-label="`Remove ${optionLabel(options, facet, value)}`"
          @click="schedule.removeFilterValues(facet, [value])"
        >
          ×
        </button>
      </span>
    </template>

    <button
      type="button"
      class="tw-ml-2 tw-cursor-pointer tw-border-none tw-bg-transparent tw-font-semibold tw-text-brand hover:tw-underline"
      @click="schedule.clearFilters()"
    >
      Clear all
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { type FilterOptions, optionLabel } from "../helpers/filterOptions";
import { FILTER_FACETS } from "../types";
import type { ScheduleEditor } from "../useScheduleEditor";

const props = defineProps<{
  options: FilterOptions;
  schedule: ScheduleEditor;
  shownCount: number;
  totalCount: number;
}>();

const filters = computed(() => props.schedule.filters);

const facetsInUse = computed(() =>
  FILTER_FACETS.filter((facet) => filters.value[facet].length > 0),
);
</script>
