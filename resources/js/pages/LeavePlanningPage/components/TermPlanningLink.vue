<template>
  <router-link
    v-if="canViewTermPlanning"
    :to="{ name: 'termPlanning', params: { groupId, termCode: termId } }"
  >
    <slot />
  </router-link>
  <span v-else>
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  groupId: number;
  termId: number;
  canViewTermPlanning: boolean;
}>();
</script>
