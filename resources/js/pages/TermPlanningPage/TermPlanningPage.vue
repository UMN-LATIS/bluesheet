<template>
  <div class="tw-p-4">
    <header class="tw-mb-8">
      <h1>Term Planning</h1>
      <p class="tw-text-neutral-500">
        A week grid of the classes a department offers in one term.
      </p>
    </header>

    <ScheduleGrid />
  </div>
</template>

<script setup lang="ts">
import ScheduleGrid from "./components/ScheduleGrid.vue";

defineProps<{
  groupId: number;
  termCode: number | null;
}>();
</script>
