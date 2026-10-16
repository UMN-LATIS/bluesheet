<template>
  <div role="cell" :aria-colspan="columnCount">
    <div class="tw-sticky tw-left-2 tw-w-max">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ columnCount: number }>();
</script>
