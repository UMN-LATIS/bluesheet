<!--
  The leave panel's frame while its people and leaves are still on the wire.
  Selecting a chip in the strip leaves no mark on the chip itself, so without
  this a click would show nothing at all until the answer lands.
-->
<template>
  <aside
    aria-label="Leave details"
    aria-busy="true"
    class="tw-flex tw-h-full tw-w-full tw-min-h-0 tw-flex-col tw-bg-surface-bright tw-text-on-surface"
  >
    <PanelHeader title="…" subtitle="" @close="emit('close')" />
  </aside>
</template>

<script setup lang="ts">
import PanelHeader from "@/components/planning/PanelHeader.vue";

const emit = defineEmits<{ close: [] }>();
</script>
