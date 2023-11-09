<template>
  <Button
    variant="tertiary"
    :class="{
      'disabled:hover:tw-bg-transparent disabled:tw-text-neutral-400 disabled:tw-cursor-not-allowed tw-mr-2':
        variant === 'secondary',
      'tw-text-red-500 hover:tw-text-red-600 hover:tw-bg-red-100':
        variant === 'danger',
      '!tw-bg-bs-blue tw-text-white disabled:tw-opacity-25':
        variant === 'primary',
    }"
  >
    <slot />
  </Button>
</template>
<script setup lang="ts">
import Button from "@/components/Button.vue";

withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "danger";
  }>(),
  {
    variant: "secondary",
  },
);
</script>
<style scoped></style>
