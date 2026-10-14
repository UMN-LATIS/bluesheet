<template>
  <input
    type="checkbox"
    :checked="isChecked"
    :disabled="!canEdit"
    :aria-label="label"
    class="tw-m-0 tw-h-4 tw-w-4 tw-cursor-pointer tw-accent-primary disabled:tw-cursor-not-allowed disabled:tw-opacity-45"
    @change="emit('change', ($event.target as HTMLInputElement).checked)"
  />
</template>

<script setup lang="ts">
defineProps<{
  isChecked: boolean;
  canEdit: boolean;
  label: string;
}>();

const emit = defineEmits<{ change: [isChecked: boolean] }>();
</script>
