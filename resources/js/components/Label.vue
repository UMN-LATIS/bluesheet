<template>
  <component
    :is="is"
    class="tw-block tw-text-xs tw-uppercase tw-text-neutral-500 tw-my-0 tw-mb-1"
  >
    <slot />
    <span v-if="required" class="tw-text-red-600">*</span>
  </component>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    required?: boolean;
    is?: string;
  }>(),
  {
    required: false,
    is: "label",
  },
);
</script>
<style scoped></style>
