<template>
  <div class="p-4">
    <header class="tw-mb-8">
      <h1>Term Planning</h1>
      <p class="tw-text-neutral-500">
        A week grid of the classes a department offers in one term.
      </p>
    </header>

    <dl class="tw-grid tw-grid-cols-[auto_1fr] tw-gap-x-4 tw-gap-y-1">
      <dt class="tw-font-semibold">Group</dt>
      <dd>{{ groupId }}</dd>
      <dt class="tw-font-semibold">Term</dt>
      <dd>{{ termCode ?? "defaults to the current term" }}</dd>
    </dl>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  groupId: number;
  termCode: number | null;
}>();
</script>
