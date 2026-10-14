<template>
  <div
    role="tablist"
    aria-label="Budget"
    class="tw-flex tw-h-9 tw-flex-none tw-items-stretch tw-gap-0.5 tw-border-0 tw-border-t tw-border-solid tw-border-outline tw-bg-surface tw-px-2"
  >
    <button
      v-for="option in TABS"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="tab === option.value"
      aria-controls="budget-tab-panel"
      class="-tw-mt-px tw-cursor-pointer tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-px-4 tw-text-xs"
      :class="
        tab === option.value
          ? 'tw-border-outline tw-bg-surface-bright tw-font-bold tw-text-on-surface'
          : 'tw-border-transparent tw-bg-transparent tw-font-semibold tw-text-on-surface-variant hover:tw-text-on-surface'
      "
      @click="emit('select', option.value)"
    >
      {{ option.label }}
    </button>
    <span
      class="tw-ml-auto tw-flex tw-items-center tw-gap-1.5 tw-pl-3 tw-text-[11px] tw-text-on-surface-variant"
    >
      <span class="tw-font-semibold tw-tabular-nums tw-text-primary">$0</span>
      Editable
    </span>
    <span
      class="tw-relative tw-flex tw-items-center tw-gap-1.5 tw-pl-3 tw-text-[11px] tw-text-on-surface-variant"
    >
      <span class="tw-relative tw-h-2 tw-w-2" aria-hidden="true">
        <OverrideMarker />
      </span>
      Override
    </span>
  </div>
</template>

<script setup lang="ts">
import OverrideMarker from "./OverrideMarker.vue";
import type { BudgetTab } from "../../helpers/viewQuery";

defineProps<{ tab: BudgetTab }>();

const emit = defineEmits<{ select: [tab: BudgetTab] }>();

const TABS: { value: BudgetTab; label: string }[] = [
  { value: "sections", label: "Sections" },
  { value: "instructors", label: "Instructors" },
  { value: "tas", label: "TAs" },
  { value: "rates", label: "Rates" },
  { value: "gradRates", label: "Grad Rates" },
];
</script>
