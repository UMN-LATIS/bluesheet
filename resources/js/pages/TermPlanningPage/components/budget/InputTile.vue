<template>
  <div
    class="tw-flex tw-min-w-0 tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-outline-variant tw-bg-surface-bright"
  >
    <span class="tw-px-2 tw-pt-1.5 tw-text-[11px] tw-text-on-surface-variant">
      {{ label }}
    </span>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>
