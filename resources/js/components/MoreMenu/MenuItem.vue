<template>
  <MenuItem v-slot="{ active }">
    <span
      :class="[
        active
          ? 'tw-bg-neutral-100 tw-text-neutral-900'
          : 'tw-text-neutral-700',
        'tw-block tw-px-4 tw-py-2 tw-text-sm',
      ]"
    >
      <slot />
    </span>
  </MenuItem>
</template>
<script setup lang="ts">
import { MenuItem } from "@headlessui/vue";
</script>
<style scoped></style>
