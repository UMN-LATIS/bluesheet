<template>
  <div class="">
    <Spinner class="tw-w-5 tw-h-5 tw-text-blue-500" />
    <span class="tw-sr-only">Loading</span>
    {{ Math.round(progress * 100) }}%
  </div>
</template>
<script setup lang="ts">
import Spinner from "./Spinner.vue";

defineProps<{
  progress: number;
}>();
</script>
<style scoped></style>
