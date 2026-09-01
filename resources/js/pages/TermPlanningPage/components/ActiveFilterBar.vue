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
        class="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-neutral-400 tw-py-0.5 tw-pl-2.5 tw-pr-0.5"
      >
        {{ optionLabel(options, facet, value) }}
        <button
          type="button"
          class="tw-flex tw-h-4 tw-w-4 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-leading-none tw-text-neutral-600 hover:tw-bg-neutral-200"
          :aria-label="`Remove ${optionLabel(options, facet, value)}`"
          @click="
            schedule.dispatch({
              type: 'filterValuesRemoved',
              facet,
              values: [value],
            })
          "
        >
          ×
        </button>
      </span>
    </template>

    <button
      type="button"
      class="tw-ml-2 tw-cursor-pointer tw-border-none tw-bg-transparent tw-font-semibold tw-text-umn-maroon hover:tw-underline"
      @click="schedule.dispatch({ type: 'filtersCleared' })"
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

/**
 * What is narrowing the grid right now, as chips a user can remove one at a
 * time. Sits above the grid rather than in the sidebar, so it is visible
 * when the sidebar is hidden.
 */
const props = defineProps<{
  options: FilterOptions;
  schedule: ScheduleEditor;
  /** Sections passing the filters, and sections in the term. */
  shownCount: number;
  totalCount: number;
}>();

const filters = computed(() => props.schedule.state.value.filters);

const facetsInUse = computed(() =>
  FILTER_FACETS.filter((facet) => filters.value[facet].length > 0),
);
</script>
