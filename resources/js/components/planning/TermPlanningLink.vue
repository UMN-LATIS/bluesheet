<template>
  <router-link
    v-if="canViewTermPlanning"
    :to="{ name: 'termPlanning', params: { groupId, termCode: termCode } }"
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
  termCode: number;
  canViewTermPlanning: boolean;
}>();
</script>
