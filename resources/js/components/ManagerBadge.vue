<template>
  <div
    class="tw-inline-flex tw-text-yellow-600 tw-gap-1 tw-items-center tw-leading-none tw-text-xs"
    title="Group Manager"
    :class="{
      'tw-bg-yellow-50 tw-px-2 tw-py-1 tw-rounded-full tw-border tw-border-solid tw-border-yellow-200 tw-leading-none':
        showLabel,
    }"
  >
    <i class="fas fa-shield-alt tw-m-0"></i>
    <span
      class="tw-uppercase"
      :class="{
        'tw-sr-only': !showLabel,
      }"
      >Manager</span
    >
  </div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    showLabel?: boolean;
  }>(),
  {
    showLabel: true,
  },
);
</script>
<style scoped></style>
