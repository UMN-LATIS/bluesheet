<template>
  <Teleport v-if="teleportTo" :to="teleportTo">
    <div v-bind="$attrs"><slot /></div>
  </Teleport>
  <div v-else><slot /></div>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    teleportTo?: string | null;
  }>(),
  {
    teleportTo: null,
  },
);
</script>
<style scoped></style>
