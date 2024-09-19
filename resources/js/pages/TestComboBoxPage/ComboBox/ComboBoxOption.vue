<template>
  <li :id="`option-${option.id ?? option.label}`">
    <div
      class="tw-flex tw-items-center tw-p-2 tw-cursor-pointer hover:tw-bg-yellow-50"
      :class="{
        'tw-bg-blue-100': isSelected,
        'tw-bg-yellow-100': isHighlighted && !isSelected,
      }"
    >
      <span class="tw-mr-2">{{ option.label }}</span>
      <span class="tw-text-gray-500">{{ option.id }}</span>
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
