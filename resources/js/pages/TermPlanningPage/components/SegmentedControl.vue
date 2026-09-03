<template>
  <div role="group" :aria-label="label" class="tw-flex tw-flex-wrap tw-gap-1.5">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="tw-min-h-11 tw-min-w-11 tw-cursor-pointer tw-rounded-[10px] tw-border tw-border-solid tw-text-[13px]"
      :class="classesFor(option)"
      :aria-pressed="chosen.includes(option.value)"
      @click="emit('choose', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
export interface SegmentedOption {
  value: string;
  label: string;
  /**
   * Renders as a dashed, unfilled chip that keeps the same look whether or
   * not it is chosen: for an option that swaps the field into a different
   * mode (an async meeting has no days) rather than one that toggles among
   * peers in the set.
   */
  isDashed?: boolean;
}

const props = defineProps<{
  label: string;
  options: SegmentedOption[];
  chosen: string[];
}>();

const emit = defineEmits<{ choose: [value: string] }>();

function classesFor(option: SegmentedOption) {
  if (option.isDashed) {
    return "tw-border-dashed tw-border-outline tw-bg-transparent tw-px-3.5 tw-font-semibold tw-text-on-surface-variant hover:tw-border-outline hover:tw-bg-surface";
  }

  return props.chosen.includes(option.value)
    ? "tw-border-primary tw-bg-primary tw-px-2 tw-font-bold tw-text-on-primary"
    : "tw-border-outline-variant tw-bg-surface-bright tw-px-2 tw-font-semibold tw-text-on-surface-variant hover:tw-border-outline hover:tw-bg-surface";
}
</script>
