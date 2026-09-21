<template>
  <Pane
    :class="[
      'tw-relative tw-flex tw-min-h-0 tw-flex-none tw-flex-col',
      isPanelDocked ? 'tw-w-[304px]' : 'tw-w-11',
    ]"
  >
    <template v-if="isPanelDocked">
      <FilterPanelHeader
        :activeFilterCount="activeFilterCount"
        @toggle="emit('toggle')"
      />
      <slot />
    </template>

    <FilterRail
      v-else
      :appliedFilters="appliedFilters"
      :activeFilterCount="activeFilterCount"
      @toggle="emit('toggle')"
    />
  </Pane>

  <template v-if="isPanelFloating">
    <div
      class="tw-absolute tw-inset-0 tw-z-40 tw-bg-black/20"
      @click="emit('toggle')"
    />
    <Pane
      :class="[
        'tw-z-50 tw-flex tw-min-h-0 tw-flex-col',
        isSmall
          ? 'tw-fixed tw-inset-0 tw-rounded-none tw-border-0 tw-shadow-none'
          : 'tw-absolute tw-inset-y-0 tw-left-[68px] tw-w-[304px] tw-shadow-[18px_0_44px_rgba(38,38,38,0.16)]',
      ]"
    >
      <FilterPanelHeader
        :activeFilterCount="activeFilterCount"
        @toggle="emit('toggle')"
      />
      <slot />
    </Pane>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Pane from "./Pane.vue";
import FilterRail from "./FilterRail.vue";
import FilterPanelHeader from "./FilterPanelHeader.vue";
import type { AppliedFilter } from "@/utils/appliedFilterSummary";

const props = defineProps<{
  appliedFilters: AppliedFilter[];
  isOpen: boolean;
  isDocked: boolean;
  isSmall: boolean;
  activeFilterCount: number;
}>();

const emit = defineEmits<{ toggle: [] }>();

const isPanelDocked = computed(() => props.isDocked && props.isOpen);
const isPanelFloating = computed(() => !props.isDocked && props.isOpen);
</script>
