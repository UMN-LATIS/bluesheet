<template>
  <span>
    {{ label }}
    <b class="tw-font-semibold tw-tabular-nums tw-text-on-surface">{{
      value
    }}</b
    >{{ after }}
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label: string; value: string; after?: string }>(), {
  after: "",
});
</script>
