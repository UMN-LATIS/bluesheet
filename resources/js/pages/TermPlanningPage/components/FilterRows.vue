<template>
  <ul class="tw-m-0 tw-list-none tw-divide-y tw-divide-neutral-100 tw-p-0">
    <li v-for="item in items" :key="item.value">
      <slot :item="item" />
    </li>
  </ul>
</template>

<script setup lang="ts" generic="T extends { value: string }">
defineProps<{
  items: T[];
}>();
</script>
