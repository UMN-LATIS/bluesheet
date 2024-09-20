<template>
  <li :id="`option-${option.id ?? option.label}`" class="tw-list-none">
    <div
      class="tw-flex tw-justify-between tw-items-center tw-rounded-md tw-cursor-pointer"
      :class="{
        'hover:tw-bg-yellow-50': !isSelected && !isHighlighted,
        'tw-bg-yellow-100 hover:tw-bg-yellow-200': isHighlighted && !isSelected,
        'tw-bg-blue-50  hover:tw-bg-blue-100': isSelected && !isHighlighted,
        'tw-bg-blue-100': isSelected && isHighlighted,
      }"
    >
      <div
        class="tw-flex tw-items-start tw-p-2 tw-cursor-pointer tw-flex-col tw-justify-center"
      >
        <span class="tw-mr-2 tw-text-sm">{{ option.label }}</span>
        <span
          v-if="option.secondaryLabel"
          class="tw-text-neutral-500 tw-text-xs"
          >{{ option.secondaryLabel }}</span
        >
      </div>
      <CircleCheckIcon
        v-if="isSelected"
        class="tw-h-5 tw-w-5 tw-text-blue-600 tw-mr-2"
        aria-hidden="true"
      />
    </div>
  </li>
</template>
<script setup lang="ts">
import CircleCheckIcon from "@/icons/CircleCheckIcon.vue";
import { ComboBoxOptionType } from ".";

defineProps<{
  option: ComboBoxOptionType;
  isSelected: boolean;
  isHighlighted: boolean;
}>();
</script>
<style scoped></style>
