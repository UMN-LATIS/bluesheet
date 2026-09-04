<template>
  <div class="tw-mb-2 tw-flex tw-items-center tw-gap-2">
    <FieldLabel class="tw-mb-0">{{ label }}</FieldLabel>
    <button
      v-if="actionLabel"
      type="button"
      class="tw--my-3 tw-ms-auto tw-cursor-pointer tw-border-none tw-bg-transparent tw-py-3 tw-pe-0 tw-ps-3 tw-text-xs tw-font-semibold tw-text-primary hover:tw-underline"
      @click="emit('act')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import FieldLabel from "./FieldLabel.vue";

defineProps<{
  label: string;
  actionLabel?: string;
}>();

const emit = defineEmits<{ act: [] }>();
</script>
