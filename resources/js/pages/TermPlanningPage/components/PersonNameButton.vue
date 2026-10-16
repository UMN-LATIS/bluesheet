<template>
  <button
    type="button"
    class="tw-block tw-max-w-full tw-cursor-pointer tw-truncate tw-border-none tw-bg-transparent tw-p-0 tw-text-left tw-text-[13.5px] tw-text-on-surface hover:tw-underline"
    :aria-label="`Show details for ${name}`"
  >
    {{ name }}
  </button>
</template>

<script setup lang="ts">
defineProps<{ name: string }>();
</script>
