<template>
  <label
    class="tw-m-0 tw-flex tw-cursor-pointer tw-items-center tw-gap-3 tw-px-3 tw-py-1.5 tw-text-xs tw-font-normal tw-text-neutral-800 hover:tw-bg-neutral-50"
  >
    <input
      type="checkbox"
      class="tw-h-4 tw-w-4 tw-flex-none tw-rounded tw-border-neutral-300 tw-text-umn-maroon focus:tw-ring-umn-maroon"
      :checked="isChecked"
      :indeterminate="isIndeterminate"
      @change="emit('toggle', ($event.target as HTMLInputElement).checked)"
    />
    <span class="tw-min-w-0 tw-flex-1"><slot /></span>
    <span class="tw-flex-none tw-text-[11px] tw-text-neutral-500">
      <slot name="annotation" />
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  isChecked: boolean;
  isIndeterminate?: boolean;
}>();

const emit = defineEmits<{ toggle: [isChecked: boolean] }>();
</script>
