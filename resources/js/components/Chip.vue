<template>
  <span
    class="tw-border tw-text-xs tw-py-1 tw-px-2 tw-rounded-full tw-uppercase"
    :class="
      filled
        ? `tw-bg-${color} tw-text-white`
        : `tw-border-${color} tw-text-${color}`
    "
  >
    <slot />
  </span>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: string;
    filled?: boolean;
  }>(),
  {
    color: "bs-blue",
    filled: false,
  },
);
</script>
<style scoped></style>
