<template>
  <div role="group" :aria-label="label" class="tw-flex tw-flex-wrap tw-gap-1">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="tw-min-w-9 tw-cursor-pointer tw-rounded-full tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold"
      :class="
        chosen.includes(option.value)
          ? 'tw-border-primary tw-bg-primary-container tw-text-on-primary-container'
          : 'tw-border-outline-variant tw-bg-surface-bright tw-text-on-surface-variant hover:tw-border-outline hover:tw-bg-surface-container'
      "
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
}

defineProps<{
  label: string;
  options: SegmentedOption[];
  chosen: string[];
}>();

const emit = defineEmits<{ choose: [value: string] }>();
</script>
