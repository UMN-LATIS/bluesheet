<template>
  <aside
    aria-label="Filters"
    class="tw-flex tw-h-full tw-w-full tw-min-h-0 tw-flex-col tw-bg-surface-bright"
  >
    <div
      v-if="isDismissible"
      class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-px-3.5 tw-pt-3"
    >
      <span class="tw-text-[13px] tw-font-bold">Filters</span>
      <button
        type="button"
        class="tw-ml-auto tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent tw-text-xl tw-leading-none tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
        aria-label="Close filters"
        @click="emit('close')"
      >
        ×
      </button>
    </div>

    <div class="tw-flex-none tw-p-3.5 tw-pb-0">
      <label class="tw-sr-only" for="leave-planning-filter-search">
        {{ searchPlaceholder }}
      </label>
      <input
        id="leave-planning-filter-search"
        v-model="searchInput"
        type="search"
        :placeholder="searchPlaceholder"
        class="tw-min-h-11 tw-w-full tw-rounded-full tw-border tw-border-solid tw-border-outline-variant tw-bg-surface tw-px-4 tw-text-[13px] tw-text-on-surface placeholder:tw-text-on-surface-variant focus:tw-border-primary focus:tw-bg-surface-bright focus:tw-outline-none"
      />
    </div>

    <div class="tw-grid tw-flex-none tw-grid-cols-2 tw-gap-2 tw-p-3.5 tw-pb-0">
      <FacetTile
        v-for="tile in planning.facetTiles"
        :key="tile.facet"
        :label="FACET_LABELS[tile.facet]"
        :count="tile.reachableCount"
        :total="tile.totalCount"
        :checkedCount="tile.checkedCount"
        :isActive="planning.activeFacet === tile.facet"
        @click="planning.openFacet(tile.facet)"
      />
    </div>

    <div
      class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-px-3.5 tw-pt-3"
    >
      <span class="tw-text-[11.5px] tw-text-on-surface-variant">
        {{ narrowingSummary }}
      </span>
      <button
        type="button"
        class="tw-ml-auto tw-flex tw-min-h-8 tw-flex-none tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-px-3 tw-text-[11.5px] tw-font-semibold"
        :class="
          isNarrowed
            ? 'tw-cursor-pointer tw-border-primary tw-bg-primary-container tw-text-primary hover:tw-bg-primary hover:tw-text-on-primary'
            : 'tw-cursor-default tw-border-outline-variant tw-bg-transparent tw-text-on-surface-variant tw-opacity-60'
        "
        :disabled="!isNarrowed"
        @click="planning.clearFilters"
      >
        <XIcon class="!tw-h-3.5 !tw-w-3.5" aria-hidden="true" />
        Clear all
      </button>
    </div>

    <div
      class="tw-flex tw-flex-none tw-items-center tw-justify-between tw-gap-2 tw-px-4 tw-pb-1.5 tw-pt-4"
    >
      <span
        class="tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-[0.07em] tw-text-on-surface-variant"
      >
        {{ FACET_LABELS[planning.activeFacet] }}
      </span>
      <button
        v-if="checkedValues.length > 0"
        type="button"
        class="tw-cursor-pointer tw-border-none tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-semibold tw-text-primary hover:tw-underline"
        @click="
          planning.removeFilterValues(planning.activeFacet, checkedValues)
        "
      >
        Clear
      </button>
    </div>

    <div
      class="scrollbar-always-visible tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-2.5 tw-pb-3"
    >
      <ul class="tw-m-0 tw-list-none tw-p-0">
        <li v-for="option in shownOptions" :key="option.value">
          <FilterRow
            :isChecked="checkedValues.includes(option.value)"
            :swatch="option.swatchClass ?? undefined"
            @toggle="toggle(option.value, $event)"
          >
            {{ option.label }}
            <template v-if="option.secondary" #secondary>
              {{ option.secondary }}
            </template>
            <template #annotation>{{ option.annotation }}</template>
          </FilterRow>
        </li>
      </ul>
      <p
        v-if="shownOptions.length === 0"
        class="tw-m-0 tw-px-2 tw-py-6 tw-text-center tw-text-[11.5px] tw-text-on-surface-variant"
      >
        Nothing here matches the filters.
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { XIcon } from "@/icons";
import FacetTile from "@/components/planning/FacetTile.vue";
import FilterRow from "@/components/planning/FilterRow.vue";
import type { LeavePlanningView } from "../useLeavePlanningView/useLeavePlanningView";
import type { FilterFacet } from "../useLeavePlanningView/types";
import type { FilterOption } from "../helpers/filterOptions";

const props = defineProps<{
  planning: LeavePlanningView;
  isDismissible?: boolean;
}>();

const emit = defineEmits<{ close: [] }>();

const FACET_LABELS: Record<FilterFacet, string> = {
  person: "People",
  course: "Courses",
  component: "Component",
  category: "Appointment",
  leaveType: "Leave type",
  status: "Status",
};

const searchInput = ref("");

const searchPlaceholder = computed(() =>
  props.planning.isHistoryShown ? "Search people, courses" : "Search people",
);

const checkedValues = computed(
  () => props.planning.filters[props.planning.activeFacet],
);

const shownOptions = computed(() => {
  const searchText = searchInput.value.trim().toLowerCase();
  if (searchText === "") return props.planning.activeFacetOptions;

  const matchesSearch = (option: FilterOption) =>
    [option.label, option.secondary ?? ""].some((text) =>
      text.toLowerCase().includes(searchText),
    );
  return props.planning.activeFacetOptions.filter(matchesSearch);
});

const isNarrowed = computed(() => props.planning.activeFilterCount > 0);

const narrowingSummary = computed(() => {
  const { shown, total, noun } = props.planning.rowCounts;
  const nouns = noun === "person" ? "people" : "courses";
  if (shown === total) return `Showing all ${total} ${nouns}`;
  return `Showing ${shown} of ${total} ${nouns}`;
});

function toggle(value: string, isChecked: boolean) {
  const facet = props.planning.activeFacet;
  if (isChecked) {
    props.planning.addFilterValues(facet, [value]);
    return;
  }
  props.planning.removeFilterValues(facet, [value]);
}
</script>
