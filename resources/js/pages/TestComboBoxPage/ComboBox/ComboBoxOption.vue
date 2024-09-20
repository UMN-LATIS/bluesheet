<template>
  <li :id="`option-${option.id ?? option.label}`" class="tw-list-none">
    <div
      class="tw-flex tw-items-start tw-p-2 tw-cursor-pointer tw-flex-col tw-justify-center"
      :class="{
        'hover:tw-bg-yellow-50': !isSelected && !isHighlighted,
        'tw-bg-yellow-100 hover:tw-bg-yellow-200': isHighlighted && !isSelected,
        'tw-bg-blue-50  hover:tw-bg-blue-100': isSelected && !isHighlighted,
        'tw-bg-blue-100': isSelected && isHighlighted,
      }"
    >
      <span class="tw-mr-2 tw-text-sm">{{ option.label }}</span>
      <span
        v-if="option.secondaryLabel"
        class="tw-text-neutral-500 tw-text-xs"
        >{{ option.secondaryLabel }}</span
      >
    </div>
  </li>
</template>
<script setup lang="ts">
import { ComboBoxOptionType } from ".";

defineProps<{
  option: ComboBoxOptionType;
  isSelected: boolean;
  isHighlighted: boolean;
}>();
</script>
<style scoped></style>
