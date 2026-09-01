<template>
  <div class="tw-p-4">
    <header class="tw-mb-8">
      <h1>Term Planning</h1>
      <p class="tw-text-neutral-500">
        A week grid of the classes a department offers in one term.
      </p>
    </header>

    <ScheduleGrid :schedule="schedule" />
  </div>
</template>

<script setup lang="ts">
import ScheduleGrid from "./components/ScheduleGrid.vue";
import { useScheduleEditor } from "./useScheduleEditor/useScheduleEditor";

defineProps<{
  groupId: number;
  termCode: number | null;
}>();

// Held here rather than inside the grid, so that the toolbar, sidebar and
// detail sheet still to come all read and change the same schedule.
const schedule = useScheduleEditor();
</script>
