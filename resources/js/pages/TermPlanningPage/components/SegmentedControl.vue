<template>
  <div role="group" :aria-label="label" class="tw-flex tw-flex-wrap tw-gap-1">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="tw-min-w-9 tw-cursor-pointer tw-rounded tw-border tw-border-solid tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold"
      :class="
        isChosen(option.value)
          ? 'tw-border-neutral-900 tw-bg-neutral-900 tw-text-white'
          : 'tw-border-neutral-300 tw-bg-white tw-text-neutral-700 hover:tw-border-neutral-500'
      "
      :aria-pressed="isChosen(option.value)"
      @click="choose(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * A row of buttons standing in for a select or a set of checkboxes, so the
 * whole of a short list is readable at a glance and one press away. Single
 * choice by default; `multiple` makes each button a toggle.
 */

export interface SegmentedOption {
  value: string;
  label: string;
}

const props = defineProps<{
  /** Names the group for a screen reader, e.g. "Component". */
  label: string;
  options: SegmentedOption[];
  multiple?: boolean;
}>();

/** A string for a single choice, a list of them when `multiple`. */
const model = defineModel<string | string[]>({ required: true });

const chosen = () => (Array.isArray(model.value) ? model.value : [model.value]);

const isChosen = (value: string) => chosen().includes(value);

function choose(value: string) {
  if (!props.multiple) {
    model.value = value;
    return;
  }

  model.value = isChosen(value)
    ? chosen().filter((held) => held !== value)
    : [...chosen(), value];
}
</script>
