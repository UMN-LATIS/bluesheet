<template>
  <!--
    The whole row is the label, so a click anywhere on it toggles the box.
    `indeterminate` is a DOM property with no attribute form, which is why it
    is bound rather than written as an attribute.
  -->
  <label
    class="tw-m-0 tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-px-3 tw-py-2 tw-text-sm tw-font-normal hover:tw-bg-neutral-50"
  >
    <input
      type="checkbox"
      class="tw-h-4 tw-w-4 tw-flex-none tw-rounded tw-border-neutral-300 tw-text-umn-maroon focus:tw-ring-umn-maroon"
      :checked="isChecked"
      :indeterminate="isIndeterminate"
      @change="emit('toggle', ($event.target as HTMLInputElement).checked)"
    />
    <span class="tw-min-w-0 tw-flex-1"><slot /></span>
    <span class="tw-flex-none tw-text-xs tw-text-neutral-500">
      <slot name="annotation" />
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  isChecked: boolean;
  /** Some, but not all, of the rows this one stands for are checked. */
  isIndeterminate?: boolean;
}>();

const emit = defineEmits<{ toggle: [isChecked: boolean] }>();
</script>
