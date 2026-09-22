<template>
  <div
    class="tw-flex tw-flex-none tw-items-center tw-gap-2 tw-pe-1.5 tw-ps-3.5 tw-pt-1.5"
  >
    <FilterIcon
      aria-hidden="true"
      :class="activeFilterCount > 0 ? 'tw-text-primary' : 'tw-text-on-surface'"
    />
    <span class="tw-text-[13px] tw-font-bold">Filters</span>

    <button
      type="button"
      class="tw-ms-auto tw-flex tw-h-11 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-rounded tw-border-none tw-bg-transparent tw-text-on-surface-variant hover:tw-bg-surface-container hover:tw-text-on-surface"
      aria-expanded="true"
      aria-label="Hide filters"
      title="Hide filters"
      @click="emit('toggle')"
    >
      <ChevronRightIcon
        class="!tw-h-4 !tw-w-4 tw-rotate-180"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon, FilterIcon } from "@/icons";

defineProps<{ activeFilterCount: number }>();

const emit = defineEmits<{ toggle: [] }>();
</script>
