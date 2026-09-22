<!--
  The filter panel shut: one tall target that says what it is hiding and that
  it opens. The summary runs up the rail because 44px leaves no room across.
-->
<template>
  <button
    type="button"
    class="group tw-flex tw-min-h-0 tw-w-full tw-flex-1 tw-cursor-pointer tw-flex-col tw-items-center tw-gap-1 tw-border-none tw-bg-transparent tw-px-0 tw-pb-3 tw-pt-1 tw-text-on-surface hover:tw-bg-primary-container"
    aria-expanded="false"
    aria-label="Show filters"
    title="Show filters"
    @click="emit('toggle')"
  >
    <span
      class="tw-flex tw-h-11 tw-w-11 tw-flex-none tw-items-center tw-justify-center tw-text-on-surface-variant group-hover:tw-text-primary"
    >
      <ChevronRightIcon class="!tw-h-5 !tw-w-5" aria-hidden="true" />
    </span>

    <span class="tw-relative tw-mt-1 tw-flex tw-flex-none tw-items-center">
      <FilterIcon
        aria-hidden="true"
        :class="activeFilterCount > 0 ? 'tw-text-primary' : ''"
      />
      <span
        v-if="activeFilterCount > 0"
        class="tw-absolute -tw-right-1.5 -tw-top-1 tw-flex tw-h-3.5 tw-min-w-3.5 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary tw-px-1 tw-text-[9px] tw-font-bold tw-leading-none tw-text-on-primary"
      >
        {{ activeFilterCount }}
      </span>
    </span>

    <span
      v-if="summary"
      class="rail-summary tw-min-h-0 tw-overflow-hidden tw-text-[11px] tw-font-semibold tw-text-primary"
    >
      {{ summary }}
    </span>
    <span v-else class="rail-summary tw-text-[11px] tw-text-on-surface-variant">
      Filters
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronRightIcon, FilterIcon } from "@/icons";
import {
  summarizeAppliedFilters,
  type AppliedFilter,
} from "@/utils/appliedFilterSummary";

const props = defineProps<{
  appliedFilters: AppliedFilter[];
  activeFilterCount: number;
}>();

const emit = defineEmits<{ toggle: [] }>();

const summary = computed(() => summarizeAppliedFilters(props.appliedFilters));
</script>

<style scoped>
.rail-summary {
  writing-mode: vertical-rl;
  rotate: 180deg;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
